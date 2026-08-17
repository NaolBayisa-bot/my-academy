import { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

function MyStudents() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user?.category_id) return

    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get(
          `/admin/category/${user.category_id}/students`
        )
        if (!cancelled) setStudents(res.data.students)
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.error || 'Failed to load students. Please try again.'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.category_id])

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>
  }

  return (
    <div>
      <h1>My Students</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '720px' }}>
        <thead>
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Current Course</th>
            <th style={thStyle}>Enrollment Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td style={tdStyle}>{student.name}</td>
              <td style={tdStyle}>{student.email}</td>
              <td style={tdStyle}>
                {student.currentEnrollment?.course?.title || '—'}
              </td>
              <td style={tdStyle}>
                {student.currentEnrollment?.status || 'none'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {students.length === 0 && <p>No students in your category yet.</p>}
    </div>
  )
}

const thStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left',
  background: '#f5f5f5',
}

const tdStyle = {
  border: '1px solid #ccc',
  padding: '8px',
}

export default MyStudents
