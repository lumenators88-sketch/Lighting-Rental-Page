'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Umbrella, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Umbrella className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">Umbrellab</span>
          </div>
          <Link href="/admin/login">
            <Button variant="ghost" className="text-slate-600 font-medium">
              관리자 로그인
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 py-20 overflow-hidden relative">

        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full point-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            강남, 홍대 등 50개 부스 운영 중
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight bg-clip-text">
            갑작스러운 비,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              이제 당황하지 마세요.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            QR코드 스캔 한 번으로 3초 만에 우산을 빌리고,
            가까운 반납소 어디에나 편하게 반납하세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 rounded-full group transition-all" asChild>
              <Link href="/admin/booths">
                부스 위치 찾기
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full shadow-sm hover:bg-slate-50" asChild>
              <Link href="/rent/test?booth=test">
                대여 체험해보기
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-6 w-full max-w-4xl mt-32"
        >
          {[
            { icon: Umbrella, title: "쉬운 대여", desc: "앱 설치 없이 QR코드만 스캔하면 바로 대여 완료!" },
            { icon: MapPin, title: "어디서나 반납", desc: "빌린 곳과 달라도 가까운 제휴 부스에 꽂아주면 끝!" },
            { icon: ShieldCheck, title: "튼튼한 내구성", desc: "강풍에도 거뜬한 16K 초경량 방풍 우산 제공" }
          ].map((feature, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
