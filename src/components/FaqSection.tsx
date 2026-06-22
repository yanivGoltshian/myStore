import { site } from "@/lib/data";

const FAQS: { q: string; a: string }[] = [
  {
    q: "איפה נמצאת החנות ומה שעות הפתיחה?",
    a: "אנחנו ברחוב יהושע חנקין 71, חולון. שעות הפתיחה: ימים א׳–ה׳ בבוקר 09:30–14:00 ואחר הצהריים 16:30–19:30 (ביום ג׳ אחר הצהריים סגור), יום ו׳ 09:30–14:00, ובשבת סגור. תמיד אפשר להתקשר לפני ההגעה ולוודא שהמוצר במלאי.",
  },
  {
    q: "איך מזמינים? יש אתר עם תשלום אונליין?",
    a: "ההזמנה פשוטה: בוחרים מוצרים, מוסיפים לעגלה ושולחים אלינו את ההזמנה בוואטסאפ או בטלפון 03-5562520, ואנחנו סוגרים איתכם את ההזמנה אישית. כך אנחנו מוודאים מלאי, מחיר מעודכן והתאמה מדויקת לצרכים שלכם. פרטי אשראי אינם נמסרים באתר.",
  },
  {
    q: "האם המוצרים מגיעים עם אחריות?",
    a: "כן. כל המוצרים שאנחנו מוכרים מגיעים עם אחריות יבואן רשמי. נשמח לעזור גם בכל שאלה או התלבטות אחרי הרכישה.",
  },
  {
    q: "אפשר לאסוף מהחנות, או שיש גם משלוחים?",
    a: "אפשר לאסוף מהחנות שלנו בחולון, וגם לתאם משלוח. דברו איתנו בוואטסאפ או בטלפון 03-5562520 ונמצא יחד את הדרך הנוחה ביותר עבורכם.",
  },
  {
    q: "אפשר לקבל ייעוץ לפני שקונים?",
    a: "בהחלט — זה בדיוק היתרון של חנות משפחתית. ספרו לנו מה אתם מחפשים ונכוון אתכם למוצר המתאים ביותר בתקציב שלכם. חייגו 03-5562520 או שלחו לנו הודעה בוואטסאפ.",
  },
  {
    q: "אילו מוצרים אפשר למצוא אצלכם?",
    a: "מגוון רחב של מוצרי חשמל ומכשירי חשמל לבית ולמטבח — מוצרים למטבח, מאווררים ומיזוג, מוצרי חורף, מוצרי טיפוח, ניקיון הבית, גרילים ומוצרים לבנים, וגם מחלקת תאורה רחבה. המלאי מתחדש כל הזמן, אז שווה לעקוב.",
  },
];

export default function FaqSection() {
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="container-x mt-14" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <h2
          id="faq-heading"
          className="text-center text-xl font-extrabold text-heading md:text-2xl"
        >
          <span className="text-brand-gold">✦</span> שאלות נפוצות
        </h2>
        <p className="mt-1.5 mb-6 text-center text-sm font-light text-muted">
          כל מה שחשוב לדעת לפני שמזמינים מ{site.name}
        </p>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group rounded-xl border bg-white px-5 py-3.5 shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[0.95rem] font-bold text-heading">
                <span>{f.q}</span>
                <span
                  className="shrink-0 text-lg leading-none text-brand-red transition-transform group-open:rotate-45"
                  aria-hidden
                >
                  ＋
                </span>
              </summary>
              <p className="mt-2.5 whitespace-pre-line text-[0.875rem] font-light leading-relaxed text-muted">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
