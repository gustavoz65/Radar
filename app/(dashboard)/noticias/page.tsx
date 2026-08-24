import { SectionHeader } from '@/components/common/section-header';
import { NewsFeed } from '@/components/news/news-feed';
import { getNews } from '@/lib/data/services';

export default async function NoticiasPage() {
  const items = await getNews();

  return (
    <div className="space-y-10">
      <SectionHeader
        eyebrow="Contexto de mercado"
        title="Notícias e radar de mercado"
        highlight="Notícias"
        description="O contexto por trás dos sinais: juros, cripto, renda variável e sistema bancário."
      />
      <NewsFeed items={items} />
    </div>
  );
}
