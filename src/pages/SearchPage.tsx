import Layout from '@/components/Layout';
import Search from './Search';

const SearchPage = () => {
  return (
    <Layout>
      <div className="h-screen overflow-hidden">
        <Search />
      </div>
    </Layout>
  );
};

export default SearchPage;
