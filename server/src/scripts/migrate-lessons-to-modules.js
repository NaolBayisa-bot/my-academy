require('dotenv').config();
const { sequelize, Module } = require('../models');

// One-time migration: introduces the Course -> Module -> Lesson hierarchy.
//
//  1. Creates the Modules table (via sequelize.sync()).
//  2. Adds a nullable `module_id` column to Lessons.
//  3. Creates a default "General" module per course.
//  4. Re-parents every existing lesson to the default module of its course
//     (preserving all lesson data and ids).
//  5. Drops the legacy `course_id` column from Lessons and makes module_id
//     NOT NULL.
//
// Safe to re-run: each step checks whether it has already been applied.

async function columnExists(table, column) {
  const result = await sequelize.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = :table AND column_name = :column`,
    { replacements: { table, column } }
  );
  return result[0].length > 0;
}

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Step 1: create ONLY the Modules table. We deliberately avoid a full
    // sequelize.sync() here because it would try to add the new NOT NULL
    // module_id column to the existing Lessons table before we've had a
    // chance to backfill it.
    await Module.sync();
    console.log('Modules table ensured.');

    // Step 2: add module_id column if missing.
    if (!(await columnExists('Lessons', 'module_id'))) {
      await sequelize.query(
        `ALTER TABLE "Lessons" ADD COLUMN "module_id" UUID REFERENCES "Modules"("id") ON DELETE CASCADE`
      );
      console.log('Added Lessons.module_id column.');
    } else {
      console.log('Lessons.module_id already exists.');
    }

    if (await columnExists('Lessons', 'course_id')) {
      // Step 3: create a default "General" module per course that does not
      // have one yet. Uses raw SQL so it also covers courses with no lessons.
      await sequelize.query(`
        INSERT INTO "Modules" ("id", "course_id", "title", "description", "order_index", "createdAt", "updatedAt")
        SELECT gen_random_uuid(), c."id", 'General',
               'Default module created during migration of existing lessons.',
               1, NOW(), NOW()
        FROM "Courses" c
        WHERE NOT EXISTS (
          SELECT 1 FROM "Modules" m WHERE m."course_id" = c."id"
        )
      `);
      console.log('Default modules ensured for all courses.');

      // Step 4: re-parent every lesson to its course's module.
      await sequelize.query(`
        UPDATE "Lessons" l
        SET "module_id" = m."id"
        FROM "Modules" m
        WHERE m."course_id" = l."course_id"
          AND l."module_id" IS NULL
      `);
      console.log('Lessons re-parented to modules.');

      // Safety check before dropping anything.
      const orphans = await sequelize.query(
        `SELECT count(*)::int AS c FROM "Lessons" WHERE "module_id" IS NULL`,
        { type: sequelize.QueryTypes.SELECT }
      );
      if (orphans[0].c > 0) {
        throw new Error(
          `${orphans[0].c} lesson(s) have no module after migration. Aborting before dropping course_id.`
        );
      }

      // Step 5: drop the legacy course_id column and make module_id required.
      await sequelize.query(`ALTER TABLE "Lessons" DROP COLUMN "course_id"`);
      console.log('Dropped legacy Lessons.course_id column.');
    } else {
      console.log('Legacy Lessons.course_id already migrated.');
    }

    // Ensure module_id is NOT NULL regardless of which path was taken.
    const isNullable = await sequelize.query(
      `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'Lessons' AND column_name = 'module_id'`,
      { type: sequelize.QueryTypes.SELECT }
    );
    if (isNullable[0] && isNullable[0].is_nullable === 'YES') {
      await sequelize.query(
        `ALTER TABLE "Lessons" ALTER COLUMN "module_id" SET NOT NULL`
      );
      console.log('Lessons.module_id set to NOT NULL.');
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

migrate();
