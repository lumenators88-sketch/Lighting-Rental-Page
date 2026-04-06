'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ArrowLeftRight, Store, LogOut, Umbrella, QrCode, Barcode } from 'lucide-react';

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
            <aside className="w-full md:w-64 bg-slate-900 border-b md:border-r border-slate-800 flex flex-col md:min-h-screen">
                <div className="h-16 flex items-center px-6 border-b border-slate-800 flex-shrink-0">
                    <h1 className="flex items-center gap-2">
                        <img
                            src="/logo.png"
                            alt="밝히는 사람들 로고"
                            className="h-7 w-auto"
                        />
                    </h1>
                </div>
                <nav className="p-4 space-y-2 flex-1">
                    <Link
                        href="/admin"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/admin' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        대시보드 (현황)
                    </Link>
                    <Link
                        href="/admin/return"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/admin/return' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <ArrowLeftRight className="w-5 h-5" />
                        <span>반납 처리</span>
                    </Link>
                    <Link
                        href="/admin/booths"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/admin/booths' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Store className="w-5 h-5" />
                        행사 관리
                    </Link>
                    <Link
                        href="/admin/qr-generator"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/admin/qr-generator' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <QrCode className="w-5 h-5" />
                        QR 생성기
                    </Link>
                    <Link
                        href="/admin/barcode-generator"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${pathname === '/admin/barcode-generator' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Barcode className="w-5 h-5" />
                        바코드 생성기
                    </Link>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white transition-colors w-full text-sm"
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
