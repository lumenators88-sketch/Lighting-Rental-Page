import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ArrowLeftRight, Store } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
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
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        대시보드 (현황)
                    </Link>
                    <Link
                        href="/admin/return"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-600">반납 처리</span>
                    </Link>
                    <Link
                        href="/admin/booths"
                        className="flex items-center gap-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    >
                        <Store className="w-5 h-5" />
                        행상 관리
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-auto">
                {children}
            </main>
        </div>
    );
}
