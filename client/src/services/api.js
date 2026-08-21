// Re-export the shared axios instance so pages/components can import it
// via the isHub-style path ("../services/api").
import api from '../api/axios'

export default api
