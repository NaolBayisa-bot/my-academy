import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchStudents = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/users')
      // Transform grouped response to flat array
      const allStudents = Object.values(data.studentsByCategory || {}).flat()
      setStudents(allStudents.filter((u) => u.role === 'STUDENT'))
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleStatusUpdate = async (studentId, status) => {
    setActionLoading(studentId)
    try {
      if (status === 'SUSPENDED') {
        await api.patch(`/admin/users/${studentId}/suspend`)
      } else if (status === 'ACTIVE') {
        await api.patch(`/admin/users/${studentId}/activate`)
      }
      await fetchStudents()
    } catch (err) {
      console.error('Failed to update student status:', err)
    } finally {
      setActionLoading(null)
    }
  }

  const statusBadge = (status) => {
    const colors = {
      PENDING:
        'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      ACTIVE:
        'bg-green-500/10 text-green-400 border border-green-500/20',
      REJECTED:
        'bg-red-500/10 text-red-400 border border-red-500/20',
      SUSPENDED:
        'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    }
    return (
      <span
        className={`inline-flex px-2.5 py-0.5 rounded-tech text-xs font-mono font-medium ${colors[status] || 'bg-slate-100 text-slate-800'}`}
      >
        {status}
      </span>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <span className="text-primary-500 font-mono">&gt; </span>Admin Panel
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-sm">
          ~/admin
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Students', value: students.length },
          {
            label: 'Pending',
            value: students.filter((s) => s.status === 'PENDING').length,
          },
          {
            label: 'Active',
            value: students.filter((s) => s.status === 'ACTIVE').length,
          },
          {
            label: 'Rejected',
            value: students.filter((s) => s.status === 'REJECTED').length,
          },
        ].map((stat) => (
          <Card key={stat.label} className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              {stat.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Student Registrations
        </h3>

        {isLoading ? (
          <Spinner className="py-12" />
        ) : students.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-center py-8">
            No student registrations yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Department
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Year
                  </th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-2 font-medium dark:text-gray-200">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                      {student.email}
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                      {student.department}
                    </td>
                    <td className="py-3 px-2 text-gray-500 dark:text-gray-400">
                      {student.academicYear}
                    </td>
                    <td className="py-3 px-2">
                      {statusBadge(student.status)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-end gap-2">
                        {student.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() =>
                                handleStatusUpdate(student.id, 'ACTIVE')
                              }
                              isLoading={actionLoading === student.id}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() =>
                                handleStatusUpdate(student.id, 'REJECTED')
                              }
                              isLoading={actionLoading === student.id}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {student.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleStatusUpdate(student.id, 'SUSPENDED')
                            }
                            isLoading={actionLoading === student.id}
                          >
                            Suspend
                          </Button>
                        )}
                        {student.status === 'SUSPENDED' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() =>
                              handleStatusUpdate(student.id, 'ACTIVE')
                            }
                            isLoading={actionLoading === student.id}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
