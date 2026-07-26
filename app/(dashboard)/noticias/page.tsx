import { SectionHeader } from '@/components/common/section-header';
import { NewsFeed } from '@/components/news/news-feed';
import { getNews } from '@/lib/data/services';

export default async function NoticiasPage() {
  const items = await getNews();

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Notícias e radar de mercado"
        description="O contexto por trás dos sinais: juros, cripto, renda variável e sistema bancário."
      />
      <NewsFeed items={items} />
    </div>
  );
}
