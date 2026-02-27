'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ArrowLeftRight, Store, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isAuth, setIsAuth] = useState(false);
    const [checking, setChecking] = useState(true);

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        const auth = sessionStorage.getItem('admin_auth');
        if (auth === 'true') {
            setIsAuth(true);
        } else if (!isLoginPage) {
            router.replace('/admin/login');
        }
        setChecking(false);
    }, [pathname, isLoginPage, router]);

    const handleLogout = () => {
        sessionStorage.removeItem('admin_auth');
        router.push('/admin/login');
    };

    // Login page: render without sidebar
    if (isLoginPage) {
        return <>{children}</>;
    }

    // Still checking auth
    if (checking || !isAuth) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">
                        ☂️ Umbrella Admin
                    </h1>
                </div>
                <nav className="p-4 space-y-1">
                    <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === '/admin' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        대시보드 (현황)
                    </Link>
                    <Link
                        href="/admin/return"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === '/admin/return' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-600 font-semibold">반납 처리</span>
                    </Link>
                    <Link
                        href="/admin/booths"
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${pathname === '/admin/booths' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                    >
                        <Store className="w-5 h-5" />
                        행사 관리
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
