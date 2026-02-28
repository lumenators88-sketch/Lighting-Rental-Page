'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Umbrella, MapPin, ShieldCheck, ArrowRight, RotateCcw, Utensils, Gift, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="밝히는 사람들 로고"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/return">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 font-medium flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                반납하기
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800 font-medium">
                관리자 로그인
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pb-20 overflow-hidden relative">

        <section className="w-full relative">
          <div className="w-full">
            <img
              src="/hero-bg-new.png"
              alt="밝히는 사람들 서비스 안내"
              className="w-full h-auto object-cover"
            />
          </div>
        </section>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-6 w-full max-w-4xl mt-32"
        >
          {[
            { icon: Utensils, title: "축제 주변 맛집 추천!", desc: "행사 주변의 맛집 정보도 함께 확인해보세요." },
            { icon: Gift, title: "후기 이벤트!", desc: "멋진 후기를 담은 사람에게 특별한 선물을 드립니다!" },
            { icon: HelpCircle, title: "우산 반납 방법", desc: "다 쓴 우산은 가까운 부스에 꽂아주면 완료!" }
          ].map((feature, i) => (
            <div
              key={i}
              className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
