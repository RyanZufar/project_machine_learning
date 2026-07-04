import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera, ChevronRight, RotateCcw, Check, Sparkles, ArrowRight,
  Leaf, Star, Shield, Heart, ChevronLeft, Info, FlaskConical, 
  User, Search, Target, Loader2, BookOpen, AlertTriangle
} from "lucide-react";

/* =========================================================
   DESIGN TOKENS
   ========================================================= */
const T = {
  bg: "linear-gradient(180deg, #EBF3FC 0%, #FFFFFF 100%)",
  surface: "#FFFFFF",
  primary: "#1B4332",
  primarySoft: "#E9F5F0",
  primaryDeep: "#112D21",
  accent: "#C77A58",
  accentSoft: "#FAF0EC",
  text: "#2D3732",
  muted: "#7E8B85",
  border: "#D0DDD6",
  success: "#2D8B5F",
  warning: "#D4A017",
  danger: "#C0392B",
  info: "#2980B9",
};

const CLASS_META = {
  Acne:         { label: "Acne",       color: "#C77A58" },
  Blackheads:   { label: "Blackheads", color: "#5A738E" },
  "Dark Spots": { label: "Dark Spots", color: "#A87C54" },
};
const CLASSES = ["Acne", "Blackheads", "Dark Spots"];

const STEPS = [
  { key: "DEPAN", title: "Tampak Depan",       guide: "Posisikan wajah lurus menghadap kamera.", tilt: 0  },
  { key: "KIRI",  title: "Tampak Kiri (±45°)", guide: "Putar wajah sedikit ke kanan.", tilt: -1 },
  { key: "KANAN", title: "Tampak Kanan (±45°)",guide: "Putar wajah sedikit ke kiri.", tilt: 1  },
];

const API_URL = "/analyze-skin";

/* =========================================================
   24-QUESTION QUESTIONNAIRE (A1–G2)
   ========================================================= */
const SECTIONS = [
  { id: "A", title: "Data Diri",              icon: User },
  { id: "B", title: "Profil Kulit",           icon: Sparkles },
  { id: "C", title: "Keluhan Kulit Utama",    icon: Search },
  { id: "D", title: "Kondisi Medis & Keamanan", icon: Shield },
  { id: "E", title: "Gaya Hidup & Lingkungan", icon: Heart },
  { id: "F", title: "Rutinitas Skincare",     icon: FlaskConical },
  { id: "G", title: "Target & Ekspektasi",    icon: Target },
];

const QUESTIONS = [
  // Section A
  { id: "A1", section: "A", text: "Berapa usia kamu?", multi: false,
    options: ["< 18 tahun","18-25 tahun","26-35 tahun","36-45 tahun","> 45 tahun"] },
  { id: "A2", section: "A", text: "Apa jenis kelamin kamu?", multi: false,
    options: ["Perempuan","Laki-laki","Lainnya / Tidak ingin menyebutkan"] },
  // Section B
  { id: "B1", section: "B", text: "Bagaimana kondisi kulitmu di sore hari (tanpa cuci muka)?", multi: false,
    options: ["Sangat berminyak & mengkilap di seluruh wajah","Berminyak hanya di T-zone (dahi, hidung, dagu), pipi normal","Terasa kencang, kering & kadang mengelupas","Normal, tidak terlalu berminyak/kering","Tidak menentu, berubah-ubah"] },
  { id: "B2", section: "B", text: "Apakah kulitmu tergolong reaktif/sensitif?", multi: false,
    options: ["Ya, sangat reaktif - hampir setiap produk baru bisa cocok/tidak","Kadang-kadang - perlu patch test","Jarang - kulit saya cukup kuat","Tidak pernah mengalami reaksi"] },
  { id: "B3", section: "B", text: "Apakah kamu pernah didiagnosis kondisi kulit berikut?", multi: true,
    options: ["Tidak ada / belum pernah ke dokter kulit","Rosacea","Dermatitis Atopik (Eksim)","Psoriasis","Melasma","Seborrheic Dermatitis","Lainnya"] },
  // Section C
  { id: "C1", section: "C", text: "Masalah kulit apa yang paling ingin kamu atasi?", multi: true,
    options: ["Jerawat aktif (Acne)","Komedo (Blackheads/Whiteheads)","Bekas jerawat / flek hitam (PIH)","Flek karena sinar matahari / aging (Hyperpigmentation)","Kulit kusam (Dullness)","Pori-pori besar (Large Pores)","Kulit kering & dehidrasi","Kulit berminyak berlebih","Warna kulit tidak merata"] },
  { id: "C2", section: "C", text: "Seberapa parah jerawat yang kamu alami saat ini?", multi: false,
    options: ["Tidak ada jerawat","Ringan (1-5 jerawat kecil, kadang-kadang)","Sedang (6-20 jerawat, sering muncul)","Parah (>20 jerawat, banyak yang meradang/besar)","Sangat parah (cystic, nodular, menutupi area luas)"],
    showIf: (a) => { const c1 = a.C1 || []; return c1.includes("Jerawat aktif (Acne)"); } },
  { id: "C3", section: "C", text: "Di area mana jerawat/komedo paling sering muncul?", multi: true,
    options: ["Dahi","Hidung","Pipi","Dagu & sekitar mulut","Punggung / dada","Menyebar merata","Tidak ada jerawat"],
    showIf: (a) => { const c1 = a.C1 || []; return c1.includes("Jerawat aktif (Acne)") || c1.includes("Komedo (Blackheads/Whiteheads)"); } },
  { id: "C5", section: "C", text: "Apakah kamu memiliki flek hitam atau hiperpigmentasi?", multi: false,
    options: ["Tidak ada","Sedikit (1-3 titik kecil)","Sedang (beberapa area)","Banyak / menyebar","Melasma (patch besar, simetris)"],
    showIf: (a) => { const c1 = a.C1 || []; return c1.includes("Bekas jerawat / flek hitam (PIH)") || c1.includes("Flek karena sinar matahari / aging (Hyperpigmentation)"); } },
  // Section D
  { id: "D1", section: "D", text: "Apakah kamu sedang dalam keadaan hamil?", multi: false,
    options: ["Tidak","Ya, sedang hamil trimester 1","Ya, sedang hamil trimester 2","Ya, sedang hamil trimester 3","Sedang program hamil (TTC)"],
    showIf: (a) => a.A2 === "Perempuan" },
  { id: "D2", section: "D", text: "Apakah kamu sedang menyusui?", multi: false,
    options: ["Tidak","Ya, sedang menyusui"],
    showIf: (a) => a.A2 === "Perempuan" },
  { id: "D3", section: "D", text: "Apakah kamu sedang menggunakan obat kulit resep dokter?", multi: true,
    options: ["Tidak","Ya - retinoid topikal (tretinoin/adapalene)","Ya - antibiotik topikal (clindamycin/erythromycin)","Ya - steroid topikal","Ya - lainnya"] },
  { id: "D4", section: "D", text: "Apakah kamu sedang mengonsumsi obat sistemik yang mempengaruhi kulit?", multi: true,
    options: ["Tidak","Ya - isotretinoin (Accutane/Roaccutane)","Ya - pil KB / hormon","Ya - antibiotik oral","Ya - obat lainnya"] },
  { id: "D5", section: "D", text: "Apakah ada bahan skincare yang kamu ketahui tidak cocok di kulitmu?", multi: false, freeText: true,
    options: ["Tidak ada / tidak tahu"] },
  { id: "D6", section: "D", text: "Apakah kamu memiliki alergi yang sudah terdiagnosis?", multi: true,
    options: ["Tidak ada alergi","Ya - alergi latex","Ya - alergi fragrance/parfum","Ya - alergi logam (nickel dll)","Ya - alergi obat tertentu","Ya - lainnya"] },
  // Section E
  { id: "E1", section: "E", text: "Seberapa sering kulitmu terpapar sinar matahari langsung per hari?", multi: false,
    options: ["< 15 menit (hampir selalu di dalam ruangan)","15-60 menit","1-3 jam","3-5 jam","> 5 jam (outdoor / kerja di luar)"] },
  { id: "E2", section: "E", text: "Apakah kamu rutin memakai sunscreen setiap hari?", multi: false,
    options: ["Ya, setiap hari tanpa terkecuali","Ya, tapi hanya saat keluar rumah","Kadang-kadang","Jarang / tidak pernah"] },
  { id: "E3", section: "E", text: "Bagaimana kualitas tidurmu rata-rata?", multi: false,
    options: ["< 5 jam per malam","5-6 jam per malam","7-8 jam per malam (ideal)","> 8 jam per malam","Tidak teratur / berubah-ubah"] },
  { id: "E4", section: "E", text: "Bagaimana tingkat stres harianmu?", multi: false,
    options: ["Rendah - jarang stres","Sedang - kadang stres tapi terkontrol","Tinggi - sering stres","Sangat tinggi - stres kronis"] },
  { id: "E5", section: "E", text: "Bagaimana pola makan harianmu?", multi: false,
    options: ["Seimbang & bervariasi","Tinggi makanan olahan / fast food","Tinggi gula & minuman manis","Banyak sayur & buah (plant-based)","Tinggi susu / produk dairy"] },
  // Section F
  { id: "F1", section: "F", text: "Produk apa yang sudah rutin kamu gunakan?", multi: true,
    options: ["Cleanser / sabun muka","Toner","Serum / Essence","Moisturizer","Sunscreen","Exfoliant (AHA/BHA)","Retinoid (retinol/tretinoin)","Vitamin C","Niacinamide","Tidak memakai skincare sama sekali"] },
  { id: "F2", section: "F", text: "Berapa waktu yang bisa kamu luangkan untuk skincare setiap hari?", multi: false,
    options: ["Minimal (< 5 menit)","Sedang (5-10 menit)","Lengkap (10-20 menit)","Tidak masalah, mau lengkap sekali"] },
  { id: "F3", section: "F", text: "Berapa budget bulanan untuk skincare?", multi: false,
    options: ["< Rp 100.000","Rp 100.000 - 300.000","Rp 300.000 - 600.000","Rp 600.000 - 1.000.000","> Rp 1.000.000","Tidak ada batasan"] },
  // Section G
  { id: "G1", section: "G", text: "Apa tujuan utama kamu menggunakan skincare? (Pilih 1-2)", multi: true,
    options: ["Mengatasi jerawat aktif","Memudarkan bekas jerawat & flek","Mencerahkan & meratakan warna kulit","Menjaga kelembapan kulit","Mengontrol minyak berlebih","Mengecilkan pori-pori"] },
  { id: "G2", section: "G", text: "Apakah ada tambahan informasi tentang kulitmu?", multi: false, freeText: true,
    options: [] },
];

/* =========================================================
   SHARED UI COMPONENTS
   ========================================================= */
const Btn = ({ children, onClick, variant = "primary", disabled, style, ...p }) => {
  const base = {
    padding: "14px 28px", borderRadius: 14, border: "none", cursor: disabled ? "default" : "pointer",
    fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8,
    transition: "all .2s", opacity: disabled ? 0.5 : 1, fontFamily: "inherit", letterSpacing: 0.2,
  };
  const variants = {
    primary:  { background: T.primary, color: "#fff" },
    accent:   { background: T.accent, color: "#fff" },
    outline:  { background: "transparent", color: T.primary, border: `2px solid ${T.border}` },
    ghost:    { background: "transparent", color: T.muted },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }} {...p}>{children}</button>;
};

function ProgressDots({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 28 : 10, height: 10, borderRadius: 6,
          background: i <= step ? T.primary : T.border, transition: "all .3s",
        }} />
      ))}
    </div>
  );
}

const Card = ({ children, style }) => (
  <div style={{
    background: T.surface, borderRadius: 20, padding: 24,
    border: `1px solid ${T.border}`,
    boxShadow: "0 8px 24px rgba(27, 67, 50, 0.06)",
    ...style,
  }}>{children}</div>
);

/* =========================================================
   WELCOME SCREEN
   ========================================================= */
function WelcomeScreen({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/female_beauty2.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px 24px",
      boxSizing: "border-box",
      position: "relative",
      gap: 16
    }}>
      {/* Background tint overlay for extra contrast */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(27, 67, 50, 0.12)",
        zIndex: 1
      }} />

      {/* Top Card: Brand & Logo */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: "24px",
        boxShadow: "0 8px 32px rgba(27, 67, 50, 0.12)",
        border: "1.5px solid rgba(255, 255, 255, 0.65)",
        width: "100%",
        maxWidth: 380,
        boxSizing: "border-box",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.primarySoft} 0%, #FFFFFF 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 16px rgba(27, 67, 50, 0.08)",
          border: `2px solid ${T.border}`
        }}>
          <Sparkles size={28} color={T.primary} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.primary, margin: 0, letterSpacing: "-0.5px" }}>SkinSync</h1>
      </div>

      {/* Bottom Card: Explanation & Call to Action */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: "30px 24px",
        boxShadow: "0 12px 36px rgba(27, 67, 50, 0.16)",
        border: "1.5px solid rgba(255, 255, 255, 0.65)",
        width: "100%",
        maxWidth: 380,
        boxSizing: "border-box",
        textAlign: "center"
      }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 500, lineHeight: 1.6, margin: "0 0 16px 0" }}>
          Analisis kondisi kulit profesional dengan kecerdasan buatan & personalisasi rekomendasi bahan aktif klinis.
        </p>

        {/* Warning Note */}
        <div style={{
          background: "rgba(245, 247, 246, 0.8)",
          border: `1px solid ${T.border}`,
          borderRadius: 14,
          padding: "12px",
          marginBottom: 20,
          textAlign: "left",
          display: "flex",
          gap: 8,
          alignItems: "flex-start"
        }}>
          <Info size={16} color={T.primary} style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 11, color: T.muted, margin: 0, lineHeight: 1.5 }}>
            <strong>Penting:</strong> Analisis ini hanya deteksi awal kondisi kulit Anda untuk tujuan edukatif, bukan diagnosis medis langsung atau instruksi penggunaan zat tanpa pengawasan ahli.
          </p>
        </div>

        <Btn onClick={onStart} style={{ boxShadow: "0 4px 12px rgba(27, 67, 50, 0.15)", width: "100%", justifyContent: "center" }}>
          Mulai Analisis <ArrowRight size={18} />
        </Btn>
      </div>
    </div>
  );
}

/* =========================================================
   GUIDE SCREEN
   ========================================================= */
function GuideScreen({ onContinue, onBack }) {
  return (
    <div style={{ padding: "40px 24px", textAlign: "center" }}>
      <Camera size={48} color={T.primary} style={{ marginBottom: 16 }} />
      <h2 style={{ color: T.primary, marginBottom: 8 }}>Panduan Foto Wajah</h2>
      <p style={{ color: T.muted, marginBottom: 24, lineHeight: 1.6 }}>
        Sistem memerlukan foto wajah dari 3 sudut untuk melakukan analisis secara akurat.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360, margin: "0 auto 32px" }}>
        {STEPS.map((s, i) => (
          <Card key={i} style={{ display: "flex", alignItems: "center", gap: 16, padding: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: T.primarySoft,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: T.primary }}>{i + 1}</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{s.guide}</div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Btn onClick={onContinue} style={{ width: "100%", maxWidth: 360, justifyContent: "center" }}>
          Buka Kamera <Camera size={18} />
        </Btn>
        <Btn variant="ghost" onClick={onBack} style={{ justifyContent: "center" }}>
          <ChevronLeft size={16} /> Kembali
        </Btn>
      </div>
    </div>
  );
}

/* =========================================================
   CAMERA CAPTURE SCREEN
   ========================================================= */
function CaptureScreen({ onComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play(); }
      } catch (e) { console.error("Camera error", e); }
    })();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const capture = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const newPhotos = [...photos, { blob, url, key: STEPS[stepIdx].key }];
      setPhotos(newPhotos);
      if (stepIdx < 2) { setStepIdx(stepIdx + 1); }
      else {
        streamRef.current?.getTracks().forEach(t => t.stop());
        onComplete(newPhotos);
      }
    }, "image/jpeg", 0.9);
  }, [stepIdx, photos, onComplete]);

  const step = STEPS[stepIdx];
  return (
    <div style={{ padding: "20px 24px", textAlign: "center" }}>
      <ProgressDots step={stepIdx} total={3} />
      <h3 style={{ color: T.primary, margin: "16px 0 4px" }}>{step.title}</h3>
      <p style={{ color: T.muted, fontSize: 13, marginBottom: 16 }}>{step.guide}</p>
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", maxWidth: 400, margin: "0 auto" }}>
        <video ref={videoRef} autoPlay playsInline muted
          style={{ width: "100%", borderRadius: 20, transform: "scaleX(-1)" }} />
        <svg viewBox="0 0 400 300" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
          <ellipse cx="200" cy="150" rx="100" ry="130" fill="none" stroke="#2D8B5F" strokeWidth="2" strokeDasharray="8 4" opacity="0.7" />
        </svg>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center" }}>
        {photos.map((p, i) => (
          <img key={i} src={p.url} alt={p.key}
            style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: `2px solid ${T.primary}` }} />
        ))}
      </div>
      <Btn onClick={capture} style={{ marginTop: 20, width: "100%", maxWidth: 400, justifyContent: "center" }}>
        <Camera size={20} /> Ambil Foto {stepIdx + 1}/3
      </Btn>
    </div>
  );
}

/* =========================================================
   ANALYZING SCREEN
   ========================================================= */
function AnalyzingScreen() {
  return (
    <div style={{ textAlign: "center", padding: "100px 24px" }}>
      <div style={{ display: "inline-flex", marginBottom: 24, animation: "spin 2s linear infinite" }}>
        <Loader2 size={48} color={T.primary} />
      </div>
      <h2 style={{ color: T.primary, fontWeight: 700 }}>Menganalisis Kulit...</h2>
      <p style={{ color: T.muted, fontSize: 14 }}>Sistem sedang memproses foto wajah menggunakan EfficientNet-B3.</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* =========================================================
   RESULTS SCREEN — with severity + tier
   ========================================================= */
/* =========================================================
   QUESTIONNAIRE SCREEN — 24 questions grouped by section
   ========================================================= */
function QuestionnaireScreen({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [freeTextVal, setFreeTextVal] = useState("");

  // Get visible questions for current section
  const sectionId = SECTIONS[currentSection].id;
  const sectionQuestions = QUESTIONS.filter(q => {
    if (q.section !== sectionId) return false;
    if (q.showIf && !q.showIf(answers)) return false;
    return true;
  });

  const q = sectionQuestions[currentQ];
  const totalVisibleInSection = sectionQuestions.length;
  const isLastQuestion = currentSection === SECTIONS.length - 1 && currentQ >= totalVisibleInSection - 1;

  const handleSelect = (option) => {
    if (!q) return;
    if (q.multi) {
      const current = answers[q.id] || [];
      // For "Tidak" / "Tidak ada" type options, clear others
      const negatives = ["Tidak","Tidak ada / tidak tahu","Tidak ada alergi","Tidak ada / belum pernah ke dokter kulit","Tidak memakai skincare sama sekali","Tidak ada jerawat"];
      if (negatives.includes(option)) {
        setAnswers({ ...answers, [q.id]: [option] });
      } else {
        const filtered = current.filter(o => !negatives.includes(o));
        if (filtered.includes(option)) {
          setAnswers({ ...answers, [q.id]: filtered.filter(o => o !== option) });
        } else {
          setAnswers({ ...answers, [q.id]: [...filtered, option] });
        }
      }
    } else {
      setAnswers({ ...answers, [q.id]: option });
      // Auto-advance for single-select
      setTimeout(() => advance(), 300);
    }
  };

  const advance = () => {
    // Save free text if applicable
    if (q?.freeText && freeTextVal.trim()) {
      setAnswers(prev => ({ ...prev, [q.id]: freeTextVal.trim() }));
      setFreeTextVal("");
    }

    if (currentQ < totalVisibleInSection - 1) {
      setCurrentQ(currentQ + 1);
    } else if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQ(0);
    } else {
      // Done
      const final = { ...answers };
      if (q?.freeText && freeTextVal.trim()) final[q.id] = freeTextVal.trim();
      onComplete(final);
    }
  };

  const goBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
    } else if (currentSection > 0) {
      const prevSection = currentSection - 1;
      const prevSectionId = SECTIONS[prevSection].id;
      const prevQs = QUESTIONS.filter(qq => {
        if (qq.section !== prevSectionId) return false;
        if (qq.showIf && !qq.showIf(answers)) return false;
        return true;
      });
      setCurrentSection(prevSection);
      setCurrentQ(Math.max(0, prevQs.length - 1));
    }
  };

  if (!q) {
    // If no visible questions in this section, auto-skip
    if (currentSection < SECTIONS.length - 1) {
      setTimeout(() => { setCurrentSection(currentSection + 1); setCurrentQ(0); }, 0);
    }
    return null;
  }

  const sec = SECTIONS[currentSection];
  const isMultiSelected = q.multi && (answers[q.id] || []).length > 0;
  const canAdvanceMulti = q.multi ? isMultiSelected : !!answers[q.id];

  // Count total progress
  const allVisible = QUESTIONS.filter(qq => !qq.showIf || qq.showIf(answers));
  const currentGlobalIdx = allVisible.findIndex(qq => qq.id === q.id);

  const SecIcon = sec.icon;

  return (
    <div style={{ padding: "24px", maxWidth: 480, margin: "0 auto" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          backgroundColor: T.primarySoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <SecIcon size={16} color={T.primary} />
        </div>
        <span style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Section {sec.id}: {sec.title}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, borderRadius: 2, background: T.border, marginBottom: 24 }}>
        <div style={{ width: `${((currentGlobalIdx + 1) / allVisible.length) * 100}%`, height: "100%", borderRadius: 2,
          background: T.primary, transition: "width .3s" }} />
      </div>

      {/* Question */}
      <h3 style={{ color: T.text, fontSize: 18, lineHeight: 1.5, marginBottom: 4 }}>{q.text}</h3>
      {q.multi && <p style={{ color: T.muted, fontSize: 12, marginBottom: 16 }}>Pilih semua yang sesuai</p>}
      {!q.multi && !q.freeText && <div style={{ height: 16 }} />}

      {/* Options */}
      {q.freeText && q.options.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {q.options.map(opt => {
            const sel = answers[q.id] === opt;
            return (
              <div key={opt} onClick={() => { setAnswers({ ...answers, [q.id]: opt }); setFreeTextVal(""); }}
                style={{
                  padding: "12px 16px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
                  background: sel ? T.primarySoft : T.surface, border: `2px solid ${sel ? T.primary : T.border}`,
                  fontWeight: sel ? 600 : 400, transition: "all .2s",
                }}>
                {opt}
              </div>
            );
          })}
        </div>
      )}

      {q.freeText && (
        <textarea value={freeTextVal} onChange={e => setFreeTextVal(e.target.value)}
          placeholder="Ketik di sini... (opsional)"
          style={{
            width: "100%", minHeight: 80, padding: 14, borderRadius: 12, border: `2px solid ${T.border}`,
            fontFamily: "inherit", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box",
          }} />
      )}

      {!q.freeText && q.options.map(opt => {
        const sel = q.multi ? (answers[q.id] || []).includes(opt) : answers[q.id] === opt;
        return (
          <div key={opt} onClick={() => handleSelect(opt)}
            style={{
              padding: "14px 16px", borderRadius: 14, marginBottom: 8, cursor: "pointer",
              background: sel ? T.primarySoft : T.surface,
              border: `2px solid ${sel ? T.primary : T.border}`,
              display: "flex", alignItems: "center", gap: 12, transition: "all .15s",
            }}>
            {q.multi && (
              <div style={{
                width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? T.primary : T.border}`,
                background: sel ? T.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {sel && <Check size={14} color="#fff" />}
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: sel ? 600 : 400, color: T.text }}>{opt}</span>
          </div>
        );
      })}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Btn variant="ghost" onClick={goBack} disabled={currentSection === 0 && currentQ === 0}>
          <ChevronLeft size={16} /> Kembali
        </Btn>
        {(q.multi || q.freeText) && (
          <Btn onClick={advance} disabled={q.multi && !canAdvanceMulti}>
            {isLastQuestion ? "Kirim" : "Lanjut"} <ChevronRight size={16} />
          </Btn>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SUBMITTING SCREEN
   ========================================================= */
function SubmittingScreen({ error, isFaceError, onRetry, onRetake }) {
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: "#FDEDEC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          border: "2px solid #FADBD8"
        }}>
          {isFaceError ? (
            <Camera size={36} color={T.danger} />
          ) : (
            <AlertTriangle size={36} color={T.danger} />
          )}
        </div>
        <h3 style={{ color: T.danger, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          {isFaceError ? "Validasi Wajah Gagal" : "Terjadi Kesalahan"}
        </h3>
        <p style={{ color: T.muted, marginBottom: 28, fontSize: 14, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 28px" }}>
          {error}
        </p>
        {isFaceError ? (
          <Btn onClick={onRetake} style={{ boxShadow: "0 4px 12px rgba(192, 57, 43, 0.15)" }}>
            <Camera size={16} /> Foto Ulang
          </Btn>
        ) : (
          <Btn variant="accent" onClick={onRetry} style={{ boxShadow: "0 4px 12px rgba(199, 122, 88, 0.15)" }}>
            <RotateCcw size={16} /> Coba Lagi
          </Btn>
        )}
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center", padding: "100px 24px" }}>
      <div style={{ display: "inline-flex", marginBottom: 24, animation: "spin 2s linear infinite" }}>
        <Loader2 size={48} color={T.primary} />
      </div>
      <h2 style={{ color: T.primary, fontWeight: 700, marginTop: 0 }}>Menyusun Rekomendasi...</h2>
      <p style={{ color: T.muted, fontSize: 14 }}>Sistem sedang menyusun formula bahan aktif terbaik untuk Anda.</p>
    </div>
  );
}

/* =========================================================
   RECOMMENDATIONS SCREEN
   ========================================================= */
const translateCategory = (cat) => {
  const m = {
    "Acne": "Jerawat",
    "Blackheads": "Komedo",
    "Dark Spots": "Flek & Noda Hitam",
  };
  return m[cat] || cat;
};

const formatAmPm = (val) => {
  if (!val) return "-";
  const v = val.toLowerCase().trim();
  if (v.includes("am+pm") || v.includes("am/pm") || (v.includes("am") && v.includes("pm"))) return "Pagi & Malam";
  if (v.includes("am") || v.includes("morning")) return "Pagi Hari";
  if (v.includes("pm") || v.includes("night") || v.includes("evening")) return "Malam Hari";
  return val;
};

const formatFrequency = (val) => {
  if (!val) return "-";
  const v = val.toLowerCase().trim();
  if (v.includes("nightly (3x->daily)") || v.includes("3x->daily") || v.includes("3x -> daily")) return "Malam (bertahap dari 3x/minggu)";
  if (v.includes("1-2x daily") || v.includes("1-2x sehari")) return "1-2 Kali Sehari";
  if (v.includes("daily") || v.includes("sehari sekali")) return "Setiap Hari";
  if (v.includes("2-3x weekly") || v.includes("2-3x seminggu")) return "2-3 Kali Seminggu";
  if (v.includes("weekly") || v.includes("seminggu sekali")) return "1 Kali Seminggu";
  return val;
};

const formatForm = (val) => {
  if (!val) return "-";
  return val.split(",")
    .map(s => {
      const t = s.trim().toLowerCase();
      if (t === "cream") return "Krim";
      if (t === "spot treatment") return "Spot Treatment";
      if (t === "sunscreen") return "Sunscreen";
      if (t === "toner") return "Toner";
      if (t === "serum") return "Serum";
      return s.trim();
    })
    .join(", ");
};

const formatFormValue = (val) => {
  if (!val) return "-";
  return val.replace(/—|–/g, "-");
};

const translateRecommendation = (rec) => {
  if (!rec) return "";
  const r = rec.trim().toLowerCase().replace(/—|–/g, "-");
  
  // Mapping database English phrases to friendly Indonesian phrases
  const mapping = {
    "always combine these three signature formula": "Selalu gunakan kombinasi tiga bahan ini sebagai formula utama.",
    "always follow actives with ceramide moisturizer": "Selalu dampingi penggunaan bahan aktif dengan pelembap yang mengandung Ceramide.",
    "always include panthenol in retinol routine": "Sangat disarankan mendampingi penggunaan Retinol dengan Panthenol untuk menenangkan kulit.",
    "apply bha first, wait, then vitc or separate am/pm": "Gunakan BHA terlebih dahulu, tunggu sejenak, baru gunakan Vitamin C. Atau bagi menjadi penggunaan Pagi (BHA) dan Malam (Vitamin C).",
    "apply bp in am, retinol in pm": "Gunakan Benzoyl Peroxide di pagi hari dan Retinol di malam hari.",
    "apply centella after aha/bha to soothe": "Gunakan Centella Asiatica setelah eksfoliasi AHA/BHA untuk menenangkan kulit.",
    "apply acid, wait, then peptide or different times": "Gunakan eksfoliator asam terlebih dahulu, tunggu meresap, lalu gunakan Peptide. Atau gunakan pada waktu yang berbeda.",
    "apply niacinamide first or combine in moisturizer": "Gunakan Niacinamide terlebih dahulu, atau campurkan bersama pelembap.",
    "apply peptide after exfoliant step (different time)": "Gunakan Peptide setelah langkah eksfoliasi selesai (disarankan pada waktu yang berbeda).",
    "avoid combining; or very low concentrations": "Hindari mencampur kedua bahan ini, atau gunakan dengan konsentrasi yang sangat rendah.",
    "bp am + adapalene pm, or epiduo formula": "Gunakan Benzoyl Peroxide di pagi hari dan Adapalene di malam hari.",
    "both pm only, separate nights if irritation": "Kedua bahan ini hanya untuk malam hari. Pisahkan malam penggunaannya jika kulit terasa teriritasi.",
    "can combine freely": "Dapat dikombinasikan dengan aman.",
    "can combine bakuchiol stabilizes retinol": "Dapat dikombinasikan secara aman. Bakuchiol membantu menstabilkan Retinol.",
    "do not layer multiple ahas together": "Hindari menumpuk beberapa jenis produk AHA sekaligus dalam satu rutinitas.",
    "effective combo for acne; use carefully": "Kombinasi efektif untuk mengatasi jerawat, gunakan dengan hati-hati.",
    "fine at typical skincare use; vitc first, wait 5-10 min": "Aman untuk penggunaan skincare harian. Gunakan Vitamin C terlebih dahulu, tunggu 5-10 menit sebelum lanjut ke langkah berikutnya.",
    "great combo for oily/acne skin": "Kombinasi yang sangat baik untuk tipe kulit berminyak atau rentan berjerawat.",
    "layer vitc first, wait 20-30 min, or use at different times": "Gunakan Vitamin C terlebih dahulu, tunggu 20-30 menit, ATAU gunakan pada waktu berbeda (pagi/malam).",
    "okay to layer but apply vitc first": "Aman untuk ditumpuk, namun disarankan menggunakan Vitamin C terlebih dahulu.",
    "separate am/pm or choose one": "Gunakan secara terpisah di pagi dan malam hari, atau pilih salah satu saja.",
    "use bp in am, retinol pm": "Gunakan Benzoyl Peroxide di pagi hari dan Retinol di malam hari.",
    "use sa in am, retinol in pm": "Gunakan Salicylic Acid (BHA) di pagi hari dan Retinol di malam hari.",
    "use vitc in am, retinol in pm": "Gunakan Vitamin C di pagi hari dan Retinol di malam hari.",
    "use on alternate days or choose one at a time": "Gunakan secara bergantian hari (selang-seling), atau gunakan salah satu saja terlebih dahulu.",
    "use on alternate nights or different pm routine": "Gunakan pada malam yang berbeda (selang-seling) untuk menghindari risiko iritasi.",
    "use only if prescribed; hq day, retinol night": "Gunakan hanya jika diresepkan/disarankan ahli. Gunakan Hydroquinone di pagi hari dan Retinol di malam hari.",
    "when on tretinoin, avoid all exfoliants": "Saat menggunakan Tretinoin, hindari penggunaan segala jenis produk eksfoliasi."
  };

  // Direct lookup or fallback to original text with standardized hyphen
  return mapping[r] || rec.replace(/—|–/g, "-");
};

function RecommendationsScreen({ data, onRestart }) {
  const { recommendations = [], interactions = [], warnings = [], lifestyle_notes = [], face_analysis = {}, is_preg_or_bf = false } = data;

  const pregBadge = (status) => {
    const m = {
      safe: { bg: "#E8F5E9", color: T.success, text: "Bumil: Aman" },
      caution: { bg: "#FFF8E1", color: T.warning, text: "Bumil: Hati-hati" },
      unsafe: { bg: "#FFEBEE", color: T.danger, text: "Bumil: Hindari" }
    };
    const s = m[status] || m.safe;
    return <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: s.bg, color: s.color, fontWeight: 600 }}>{s.text}</span>;
  };

  const positiveInteractions = interactions.filter(i => i.type === "positive");
  const conditionalInteractions = interactions.filter(i => i.type === "conditional");
  const blockedInteractions = interactions.filter(i => i.type === "blocked");

  return (
    <div style={{ padding: "24px", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Leaf size={36} color={T.primary} style={{ marginBottom: 8 }} />
        <h2 style={{ color: T.primary, fontWeight: 700, margin: "8px 0 4px" }}>Rekomendasi Bahan Aktif</h2>
        <p style={{ color: T.muted, fontSize: 13 }}>5 formula bahan aktif klinis yang disesuaikan untuk Anda</p>
      </div>

      {/* Warnings (Tier 4 / referral) */}
      {warnings.length > 0 && (
        <Card style={{ background: "#FFF3E0", borderColor: "#FFB74D", marginBottom: 16, padding: 18, boxShadow: "0 4px 12px rgba(230, 81, 0, 0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={20} color="#E65100" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              {warnings.map((w, i) => {
                const parts = w.split(":");
                const rawConcern = parts[0]?.trim();
                const rawDetail = parts.slice(1).join(":").trim();

                // Map English concerns to Indonesian
                const concernMap = {
                  "Acne": "Jerawat",
                  "Blackheads": "Komedo",
                  "Dark Spots": "Flek / Noda Hitam"
                };
                const concernIndo = concernMap[rawConcern] || rawConcern;

                // Empathy-driven framing for clinical findings
                let politeMessage = "";
                const detailLower = rawDetail.toLowerCase();
                
                if (detailLower.includes("very severe") || detailLower.includes("cystic")) {
                  politeMessage = `Terdapat indikasi jerawat meradang yang cukup intensif. Untuk penanganan yang optimal dan aman bagi kulit Anda, kami sangat menyarankan untuk berkonsultasi dengan dokter spesialis kulit.`;
                } else if (detailLower.includes("severe") || detailLower.includes("melasma")) {
                  politeMessage = `Terdapat indikasi noda/hiperpigmentasi yang cukup tebal atau luas di area wajah. Penanganan klinis oleh dokter spesialis kulit akan sangat membantu untuk hasil yang optimal.`;
                } else {
                  politeMessage = `Sistem mendeteksi indikasi kondisi kulit yang memerlukan perhatian lebih. Konsultasikan dengan dokter spesialis kulit jika kondisi terasa mengganggu.`;
                }

                return (
                  <p key={i} style={{ margin: "0 0 8px", fontSize: 13, color: "#E65100", lineHeight: 1.5 }}>
                    <strong>{concernIndo}</strong>: {politeMessage}
                  </p>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Lifestyle Notes */}
      {lifestyle_notes.length > 0 && (
        <Card style={{ background: "#E8F5E9", borderColor: "#A5D6A7", marginBottom: 16, padding: 18, boxShadow: "0 4px 12px rgba(46, 125, 50, 0.04)" }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: T.success, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Info size={16} /> Catatan Gaya Hidup
          </p>
          {lifestyle_notes.map((n, i) => {
            const parts = n.split(":");
            return (
              <p key={i} style={{ margin: "0 0 6px", fontSize: 13, color: "#2E7D32", lineHeight: 1.5 }}>
                {parts.length > 1 ? (
                  <><strong>{parts[0]}</strong>:{parts.slice(1).join(":")}</>
                ) : n}
              </p>
            );
          })}
        </Card>
      )}

      {/* Recommendation Cards */}
      {recommendations.map((rec, idx) => (
        <Card key={idx} style={{ marginBottom: 16, padding: 22, boxShadow: "0 4px 16px rgba(27, 67, 50, 0.04)" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{idx + 1}. {rec.name}</span>
              </div>
              <span style={{ fontSize: 11, color: T.primary, background: T.primarySoft, padding: "3px 8px", borderRadius: 8, fontWeight: 500 }}>{rec.category}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={14} color={T.accent} fill={T.accent} />
                <span style={{ fontWeight: 700, fontSize: 15, color: T.accent }}>{typeof rec.priority_score === 'number' ? Math.round(rec.priority_score) : rec.priority_score}</span>
              </div>
              {is_preg_or_bf && rec.pregnancy_status && pregBadge(rec.pregnancy_status)}
            </div>
          </div>

          {/* Targets */}
          {rec.targets?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {rec.targets.map(t => (
                <span key={t} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 8,
                  background: T.primarySoft,
                  color: T.primary,
                  fontWeight: 600,
                }}>{translateCategory(t)}</span>
              ))}
            </div>
          )}

          {/* Mechanism */}
          {rec.mechanism && (
            <p style={{ fontSize: 13, color: T.muted, marginBottom: 12, fontStyle: "italic", lineHeight: 1.5 }}>
              <FlaskConical size={12} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {rec.mechanism}
            </p>
          )}

          {/* Details grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 16px",
            marginBottom: 16,
            borderTop: `1px solid ${T.border}`,
            paddingTop: 14
          }}>
            {rec.concentration && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Konsentrasi</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{rec.concentration}</span>
              </div>
            )}
            {rec.product_form && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Bentuk Produk</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{formatForm(rec.product_form)}</span>
              </div>
            )}
            {rec.frequency && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Frekuensi</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{formatFrequency(rec.frequency)}</span>
              </div>
            )}
            {rec.am_pm && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, color: T.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Waktu Aplikasi</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{formatAmPm(rec.am_pm)}</span>
              </div>
            )}
          </div>

          {/* Combine / Avoid */}
          {rec.combine_with && (
            <div style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
              <span style={{ color: T.success, fontWeight: 600 }}>Kombinasi Terbaik:</span> <span style={{ color: T.text }}>{rec.combine_with.replace(/—|–/g, "-")}</span>
            </div>
          )}
          {rec.avoid_with && rec.avoid_with !== "-" && rec.avoid_with !== "–" && rec.avoid_with !== "—" && (
            <div style={{ fontSize: 12, marginBottom: 6, lineHeight: 1.4 }}>
              <span style={{ color: T.danger, fontWeight: 600 }}>Hindari Bersamaan:</span> <span style={{ color: T.text }}>{rec.avoid_with.replace(/—|–/g, "-")}</span>
            </div>
          )}

          {/* Pregnancy warning */}
          {rec.pregnancy_note && (
            <div style={{ fontSize: 12, marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#FAFAFA", border: `1px solid ${T.border}`, color: T.text, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600 }}>Proteksi Kehamilan:</span> {rec.pregnancy_note.replace(/—|–/g, "-")}
            </div>
          )}

          {/* Caution note */}
          {rec.caution_note && (
            <div style={{ fontSize: 12, marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#FAFAFA", border: `1px solid ${T.border}`, color: T.text, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 600 }}>Petunjuk Penggunaan:</span> {rec.caution_note.replace(/—|–/g, "-")}
            </div>
          )}

          {/* Evidence badge */}
          {rec.evidence && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={12} />
              <span>{rec.evidence.replace(/—|–/g, "-")}</span>
            </div>
          )}
        </Card>
      ))}

      {recommendations.length === 0 && (
        <Card style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: T.muted }}>Tidak ada rekomendasi yang cocok untuk profil kulit Anda saat ini.</p>
        </Card>
      )}

      {/* Interactions Section */}
      {(positiveInteractions.length > 0 || conditionalInteractions.length > 0 || blockedInteractions.length > 0) && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: T.primary, fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Interaksi Bahan</h3>

          {positiveInteractions.map((ix, i) => (
            <Card key={`pos-${i}`} style={{ background: "#E8F5E9", borderColor: "#A5D6A7", marginBottom: 10, padding: 14, boxShadow: "0 2px 8px rgba(46, 125, 50, 0.02)" }}>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong style={{ color: T.success }}>Kombinasi Sinergis:</strong> {ix.a} + {ix.b}
                {ix.recommendation && <div style={{ color: "#2E7D32", marginTop: 4 }}>{translateRecommendation(ix.recommendation)}</div>}
              </div>
            </Card>
          ))}

          {conditionalInteractions.map((ix, i) => (
            <Card key={`cond-${i}`} style={{ background: "#FFF8E1", borderColor: "#FFE082", marginBottom: 10, padding: 14, boxShadow: "0 2px 8px rgba(245, 127, 23, 0.02)" }}>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong style={{ color: T.warning }}>Perhatian Khusus:</strong> {ix.a} + {ix.b}
                {ix.recommendation && <div style={{ color: "#F57F17", marginTop: 4 }}>{translateRecommendation(ix.recommendation)}</div>}
              </div>
            </Card>
          ))}

          {blockedInteractions.map((ix, i) => (
            <Card key={`blk-${i}`} style={{ background: "#FFEBEE", borderColor: "#EF9A9A", marginBottom: 10, padding: 14, boxShadow: "0 2px 8px rgba(198, 40, 40, 0.02)" }}>
              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <strong style={{ color: T.danger }}>Kontraindikasi (Jangan Dicampur):</strong> {ix.a} + {ix.b}
                {ix.recommendation && <div style={{ color: "#C62828", marginTop: 4 }}>{translateRecommendation(ix.recommendation)}</div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Restart button */}
      <div style={{ textAlign: "center", marginTop: 36, marginBottom: 40 }}>
        <Btn variant="outline" onClick={onRestart} style={{ boxShadow: "0 2px 8px rgba(27, 67, 50, 0.04)" }}>
          <RotateCcw size={16} /> Analisis Ulang
        </Btn>
      </div>
    </div>
  );
}

/* =========================================================
   DESKTOP REDIRECT SCREEN
   ========================================================= */
function DesktopRedirectScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: "url('/female_beauty2.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "40px 24px",
      boxSizing: "border-box",
      position: "relative",
      gap: 16,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Background tint overlay for extra contrast */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(27, 67, 50, 0.12)",
        zIndex: 1
      }} />

      {/* Top Card: Brand & Logo */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: "24px",
        boxShadow: "0 8px 32px rgba(27, 67, 50, 0.12)",
        border: "1.5px solid rgba(255, 255, 255, 0.65)",
        width: "100%",
        maxWidth: 380,
        boxSizing: "border-box",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12
      }}>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${T.primarySoft} 0%, #FFFFFF 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 16px rgba(27, 67, 50, 0.08)",
          border: `2px solid ${T.border}`
        }}>
          <Sparkles size={28} color={T.primary} />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: T.primary, margin: 0, letterSpacing: "-0.5px" }}>SkinSync</h1>
      </div>

      {/* Redirect Card */}
      <div style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRadius: 24,
        padding: "36px 24px",
        boxShadow: "0 12px 36px rgba(27, 67, 50, 0.16)",
        border: "1.5px solid rgba(255, 255, 255, 0.65)",
        maxWidth: 380,
        width: "100%",
        textAlign: "center",
        boxSizing: "border-box"
      }}>
        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "linear-gradient(135deg, #E9F5F0 0%, #FFFFFF 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          border: "2px solid #D0DDD6",
          boxShadow: "0 4px 12px rgba(27, 67, 50, 0.06)"
        }}>
          <Camera size={28} color="#1B4332" />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1B4332", marginBottom: 8, letterSpacing: "-0.3px", marginTop: 0 }}>
          Buka di Perangkat Mobile
        </h2>

        <p style={{ color: "#7E8B85", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          Aplikasi SkinSync memerlukan akses kamera untuk menganalisis kondisi kulit. Silakan buka halaman ini menggunakan <strong style={{ color: "#2D3732" }}>smartphone atau tablet</strong> Anda.
        </p>

        <div style={{
          background: "rgba(245, 247, 246, 0.8)",
          borderRadius: 16,
          padding: "16px",
          marginBottom: 20,
          border: "1px solid #E2EAE6"
        }}>
          <p style={{ fontSize: 12, color: "#2D3732", fontWeight: 600, margin: "0 0 6px 0" }}>
            Cara mengaksesnya:
          </p>
          <p style={{ fontSize: 12, color: "#7E8B85", lineHeight: 1.6, margin: 0 }}>
            Salin URL halaman ini, lalu buka di browser smartphone Anda. Pastikan koneksi berada di jaringan yang sama.
          </p>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 14px",
          background: "#E9F5F0",
          borderRadius: 12,
          fontSize: 12,
          color: "#1B4332",
          fontWeight: 500
        }}>
          <Sparkles size={12} color="#1B4332" />
          <span>SkinSync - Analisis Kulit Berbasis AI</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */
export default function App() {
  const [screen, setScreen] = useState("welcome");
  const [photos, setPhotos] = useState([]);
  const [faceAnalysis, setFaceAnalysis] = useState(null);
  const [fullResult, setFullResult] = useState(null);
  const [error, setError] = useState(null);
  const [isFaceError, setIsFaceError] = useState(false);

  // Detect desktop/laptop — must be after all hooks
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && window.screen.width <= 1024);

  // After camera capture → send photos for initial analysis
  const handlePhotosComplete = async (capturedPhotos) => {
    setPhotos(capturedPhotos);
    setScreen("analyzing");
    setError(null);
    setIsFaceError(false);

    try {
      const fd = new FormData();
      fd.append("file_depan", capturedPhotos.find(p => p.key === "DEPAN").blob, "depan.jpg");
      fd.append("file_kiri",  capturedPhotos.find(p => p.key === "KIRI").blob,  "kiri.jpg");
      fd.append("file_kanan", capturedPhotos.find(p => p.key === "KANAN").blob, "kanan.jpg");

      const res = await fetch(API_URL, { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (res.status === 422 && errData?.detail && typeof errData.detail === "object") {
          setIsFaceError(true);
          setError(errData.detail.message || "Validasi wajah gagal.");
        } else {
          setError(errData?.detail || `Server error: ${res.status}`);
        }
        setScreen("submitting");
        return;
      }
      const data = await res.json();
      setFaceAnalysis(data.face_analysis);
      setScreen("questionnaire");
    } catch (e) {
      setError(e.message);
      setScreen("submitting");
    }
  };

  // After questionnaire → send photos + all answers for full recommendation
  const handleQuestionnaireComplete = async (answers) => {
    setScreen("submitting");
    setError(null);
    setIsFaceError(false);

    try {
      const fd = new FormData();
      fd.append("file_depan", photos.find(p => p.key === "DEPAN").blob, "depan.jpg");
      fd.append("file_kiri",  photos.find(p => p.key === "KIRI").blob,  "kiri.jpg");
      fd.append("file_kanan", photos.find(p => p.key === "KANAN").blob, "kanan.jpg");

      for (const q of QUESTIONS) {
        const val = answers[q.id];
        if (val === undefined || val === null) {
          fd.append(q.id, "");
        } else if (Array.isArray(val)) {
          fd.append(q.id, val.join(","));
        } else {
          fd.append(q.id, String(val));
        }
      }

      const res = await fetch(API_URL, { method: "POST", body: fd });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.detail || `Server error: ${res.status}`);
        return;
      }
      const data = await res.json();
      setFullResult(data);
      setScreen("recommendations");
    } catch (e) {
      setError(e.message);
    }
  };

  const restart = () => {
    setScreen("welcome");
    setPhotos([]);
    setFaceAnalysis(null);
    setFullResult(null);
    setError(null);
    setIsFaceError(false);
  };

  const retakePhotos = () => {
    setPhotos([]);
    setFaceAnalysis(null);
    setError(null);
    setIsFaceError(false);
    setScreen("capture");
  };

  // Show redirect screen for desktop users
  if (!isMobile) {
    return <DesktopRedirectScreen />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      color: T.text,
      maxWidth: 520,
      margin: "0 auto",
      boxShadow: "0 0 40px rgba(27, 67, 50, 0.12)",
      borderLeft: `1px solid ${T.border}`,
      borderRight: `1px solid ${T.border}`
    }}>
      <style>{`
        h1, h2, h3, h4, h5, h6, button, input, textarea, select {
          font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
        }
      `}</style>
      {screen === "welcome"         && <WelcomeScreen onStart={() => setScreen("guide")} />}
      {screen === "guide"           && <GuideScreen onContinue={() => setScreen("capture")} onBack={() => setScreen("welcome")} />}
      {screen === "capture"         && <CaptureScreen onComplete={handlePhotosComplete} />}
      {screen === "analyzing"       && <AnalyzingScreen />}
      {screen === "questionnaire"   && <QuestionnaireScreen onComplete={handleQuestionnaireComplete} />}
      {screen === "submitting"      && <SubmittingScreen error={error} isFaceError={isFaceError} onRetry={() => handleQuestionnaireComplete({})} onRetake={retakePhotos} />}
      {screen === "recommendations" && <RecommendationsScreen data={fullResult} onRestart={restart} />}
    </div>
  );
}
