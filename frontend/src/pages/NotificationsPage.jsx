import { MainLayout } from '../components/layout/MainLayout'
import { NotificationCenter } from '../components/notifications/NotificationSystem'

export const NotificationsPage = () => {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <NotificationCenter />
      </div>
    </MainLayout>
  )
}