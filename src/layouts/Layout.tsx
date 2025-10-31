import { Outlet } from 'react-router-dom'
import { DashboardLayout } from '@toolpad/core'

export default function Layout() {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    )
}