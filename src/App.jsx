import React, { useState, useEffect } from 'react';
import { categoriesParams, MAX_LINK } from './data/categories.js';
import { priceSections } from './data/priceTable.js';
import { fetchDb } from './lib/githubData.js';
import AdminPanel from './components/AdminPanel.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomeView from './components/HomeView.jsx';
import CategoryDetail from './components/CategoryDetail.jsx';
import PriceView from './components/PriceView.jsx';
import SvgIcon, { MSG_ICON } from './components/SvgIcon.jsx';

const App = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [showPrice, setShowPrice]           = useState(false);
  const [showAdmin, setShowAdmin]           = useState(false);
  const [siteCategories, setSiteCategories] = useState(categoriesParams);
  const [sitePrices, setSitePrices]         = useState(priceSections);
  const [priceHeader, setPriceHeader]       = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);

  const fetchSiteData = async () => {
    try {
      const data = await fetchDb();
      if (!data) return;

      if (data.categories) {
        const sanitized = data.categories.map(cat => ({
          ...cat,
          img: cat.img?.replace(/^\//, '') || cat.img,
          prices: cat.prices?.map(p => ({
            ...p,
            img: p.img?.replace(/^\//, '') || p.img
          })).filter(p => p.enabled !== false)
        }));
        setSiteCategories(sanitized);
      }

      if (data.prices && Array.isArray(data.prices)) {
        const mergedPrices = priceSections.map(defaultSec => {
          const dbSec = data.prices.find(s => s.id === defaultSec.id);
          if (!dbSec) return defaultSec;
          
          const dbHasRows = Array.isArray(dbSec.rows);

          const mergedRows = defaultSec.rows
            .map(defaultRow => {
              const dbRow = dbSec.rows?.find(r => r.id === defaultRow.id);
              if (!dbRow) {
                if (dbHasRows) return null;
                return defaultRow;
              }
              return {
                ...defaultRow,
                ...dbRow,
                complexHeaders: dbRow.complexHeaders || defaultRow.complexHeaders,
                complexSubHeaders: dbRow.complexSubHeaders || defaultRow.complexSubHeaders,
                hasComplexTable: dbRow.hasComplexTable !== undefined ? dbRow.hasComplexTable : defaultRow.hasComplexTable
              };
            })
            .filter(Boolean)
            .filter(r => r.enabled !== false);

          if (dbHasRows) {
            const defaultRowIds = new Set(defaultSec.rows.map(r => r.id));
            const newRows = dbSec.rows.filter(r => r.id && !defaultRowIds.has(r.id));
            mergedRows.push(...newRows.filter(r => r.enabled !== false));
          }

          return { ...defaultSec, ...dbSec, rows: mergedRows };
        });
        setSitePrices(mergedPrices);
      }

      if (data.price_header) {
        setPriceHeader(data.price_header);
      }
    } catch (err) {
      console.error('Unexpected error fetching site data:', err);
    }
  };

  useEffect(() => {
    fetchSiteData();
  }, []);

  useEffect(() => {
    if (!showAdmin) {
      fetchSiteData();
    }
  }, [showAdmin]);

  useEffect(() => {
    if (window.location.hash === '#admin') {
      setShowAdmin(true);
    }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash;
      if (h === '#admin') {
        setShowAdmin(true);
        setShowPrice(false);
        setActiveCategory(null);
      } else if (h === '#price') {
        setShowPrice(true);
        setShowAdmin(false);
        setActiveCategory(null);
      } else if (h.startsWith('#category-')) {
        setShowPrice(false);
        setShowAdmin(false);
        const catId = h.replace('#category-', '');
        const found = siteCategories.find(c => c.id === catId);
        if (found && found.enabled !== false) {
          setActiveCategory(found);
        } else {
          handleBack();
        }
      } else {
        setActiveCategory(null);
        setShowPrice(false);
        setShowAdmin(false);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [siteCategories]);

  const handleSelectCategory = (cat) => {
    setActiveCategory(cat);
    setShowPrice(false);
    setShowAdmin(false);
    window.location.hash = `category-${cat.id}`;
  };

  const handleShowPrice = (sectionId) => {
    setSelectedSectionId(typeof sectionId === 'string' ? sectionId : null);
    setShowPrice(true);
    setActiveCategory(null);
    setShowAdmin(false);
    window.location.hash = 'price';
    if (!sectionId) window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setActiveCategory(null);
    setShowPrice(false);
    setShowAdmin(false);
    history.replaceState(null, '', window.location.pathname);
  };

  const handleLogoClick = () => {
    setActiveCategory(null);
    setShowPrice(false);
    setShowAdmin(false);
    history.replaceState(null, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showAdmin) {
    return (
      <AdminPanel 
        onExit={() => { 
          window.location.hash = ''; 
          setShowAdmin(false); 
        }} 
      />
    );
  }

  const isHome = !activeCategory && !showPrice && !showAdmin;

  return (
    <>
      <Header onLogoClick={handleLogoClick} onPriceClick={handleShowPrice} />

      <main>
        {showPrice ? (
          <PriceView 
            onBack={handleBack} 
            priceData={sitePrices} 
            priceHeader={priceHeader} 
            initialSectionId={selectedSectionId} 
          />
        ) : activeCategory ? (
          <CategoryDetail category={activeCategory} onBack={handleBack} onPriceClick={handleShowPrice} />
        ) : (
          <HomeView
            categories={siteCategories}
            onSelectCategory={handleSelectCategory}
            onPriceClick={handleShowPrice}
          />
        )}
      </main>

      <Footer />

      {isHome && (
        <a href={MAX_LINK} target="_blank" rel="noreferrer" className="max-widget">
          <SvgIcon path={MSG_ICON} />
          Написать в MAX
        </a>
      )}
    </>
  );
};

export default App;
