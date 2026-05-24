import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { getSiteSettings } from '@/lib/site-settings';
import ReactMarkdown from 'react-markdown';

const POLICY_MAP: Record<string, string> = {
  'chinh-sach-giao-hang': 'morningfruit.com.vn_pages_chinh-sach-giao-hang.md',
  'chinh-sach-doi-tra': 'morningfruit.com.vn_pages_chinh-sach-doi-tra.md',
  'chinh-sach-bao-mat': 'morningfruit.com.vn_pages_chinh-sach-bao-mat.md',
  'dieu-khoan-dich-vu': 'morningfruit.com.vn_pages_dieu-khoan-dich-vu.md',
  'chinh-sach-thanh-vien': 'morningfruit.com.vn_pages_chinh-sach-thanh-vien.md',
  'huong-dan-mua-hang-online': 'morningfruit.com.vn_pages_huong-dan-mua-hang-online.md',
  'about-us': 'morningfruit.com.vn_pages_about-us.md'
};

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const settings = await getSiteSettings();
  const fileName = POLICY_MAP[slug];

  if (!fileName) {
    notFound();
  }

  const localLegalPath = path.join(process.cwd(), 'src', 'data', 'legal', `${slug}.md`);
  const crawlFilePath = path.join(process.cwd(), '..', 'datacrawl', fileName);
  
  let content = "";
  let title = "";

  try {
    if (fs.existsSync(localLegalPath)) {
      content = fs.readFileSync(localLegalPath, 'utf-8');
    } else if (fs.existsSync(crawlFilePath)) {
      const rawContent = fs.readFileSync(crawlFilePath, 'utf-8');
      content = rawContent.replace(/^---[\s\S]*?---/, '').trim();
    } else {
        throw new Error("File not found");
    }
    
    const titleMatch = content.match(/^# (.*)/);
    if (titleMatch) {
      title = titleMatch[1];
      content = content.replace(/^# .*/, '').trim();
    } else {
      title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      if (slug === 'about-us') title = "Về Chúng Tôi";
    }

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    content = content.replace(/\[EFF_DATE\]/g, formattedDate);
    
    // Inject custom policies like Free Ship
    if (slug === 'chinh-sach-giao-hang') {
        content = content.replace(/\[X\.000\.000đ\]/g, "500.000đ");
        content = content.replace(/\[Y\]km/g, "3km");
    }

  } catch (error) {
    console.error("Error reading policy file:", error);
    notFound();
  }

  return (
    <div className="bg-white min-h-screen pt-32 pb-20 text-gray-900">
      <div className="container mx-auto px-4 max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            {title}
          </h1>
          <div className="h-1.5 w-20 bg-green-500 mx-auto rounded-full"></div>
        </header>

        <div className="markdown-content text-gray-600 leading-relaxed">
          <ReactMarkdown
            components={{
              h2: ({node, ...props}) => <h2 className="text-2xl font-black text-gray-900 mt-10 mb-4 uppercase tracking-tight" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-bold text-gray-800 mt-8 mb-3" {...props} />,
              p: ({node, ...props}) => <p className="mb-4" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
              li: ({node, ...props}) => <li className="pl-2" {...props} />,
              strong: ({node, ...props}) => <strong className="font-black text-gray-900" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        <div className="mt-20 p-8 bg-green-50 rounded-[2rem] border border-green-100 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Bạn cần hỗ trợ thêm?</h3>
            <p className="text-gray-600">Liên hệ trực tiếp với đội ngũ của {settings.webName} để được tư vấn nhanh nhất.</p>
          </div>
          <a href={`tel:${settings.contact.phone}`} className="mt-6 md:mt-0 px-8 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-all inline-block">
            Gọi ngay: {settings.contact.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
