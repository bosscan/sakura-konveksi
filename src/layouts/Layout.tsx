import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@toolpad/core'
import { useEffect, useState } from 'react'
import kvStore from '../lib/kvStore'
import { LS_KEYS } from '../lib/auth'

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const isAuth = await kvStore.get(LS_KEYS.IS_AUTH);
                if (!mounted) return;
                if (!isAuth) {
                    navigate('/landing');
                }
            } finally {
                if (mounted) setChecking(false);
            }
        })();
        const sub = kvStore.subscribe(LS_KEYS.IS_AUTH, (v) => { if (!v) navigate('/landing'); });
        return () => { mounted = false; try { sub.unsubscribe(); } catch {} };
    }, [location.pathname, navigate]);

    if (checking) return null;
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    )
}