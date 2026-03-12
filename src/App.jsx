import React, { useState, useCallback } from 'react';
import Home from './components/Home';
import Detail from './components/Detail';
import Analysis from './components/Analysis';
import TweetAnalysis from './components/TweetAnalysis';
import BottomNav from './components/BottomNav';
import SideMenu from './components/SideMenu';
import Ranking from './components/Ranking';
import History from './components/History';
import MyPage from './components/MyPage';
import PortfolioCheck from './components/PortfolioCheck';
import Toast from './components/Toast';

// Views that show bottom nav
const NAV_VIEWS = ['HOME', 'RANKING', 'HISTORY', 'MY'];
// Views that map to a nav tab
const TAB_MAP = { HOME: 'HOME', RANKING: 'RANKING', HISTORY: 'HISTORY', MY: 'MY' };

function App() {
  const [currentView, setCurrentView] = useState('HOME');
  const [activeTab, setActiveTab] = useState('HOME');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [analysisUrl, setAnalysisUrl] = useState('');
  const [tweetUrl, setTweetUrl] = useState('');
  const [dataVersion, setDataVersion] = useState(0); // bump to refresh home data
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshData = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);

  const navigate = (view, data = null) => {
    if (view === 'DETAIL') setSelectedPerson(data);
    if (view === 'ANALYSIS') setAnalysisUrl(data);
    if (view === 'TWEET_ANALYSIS') setTweetUrl(data);
    if (TAB_MAP[view]) setActiveTab(TAB_MAP[view]);
    setCurrentView(view);
    window.scrollTo(0, 0);
  };

  const showNav = NAV_VIEWS.includes(currentView);

  return (
    <div className="App">
      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Side Menu */}
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(view) => { setMenuOpen(false); navigate(view); }}
      />

      {/* Views */}
      {currentView === 'HOME' && (
        <Home
          onNavigate={navigate}
          onAnalyze={(url) => {
            // Auto-detect tweet vs news
            const isTweet = /^https?:\/\/(twitter\.com|x\.com)\/\w+\/status\/\d+/.test(url);
            if (isTweet) {
              navigate('TWEET_ANALYSIS', url);
            } else {
              navigate('ANALYSIS', url);
            }
          }}
          dataVersion={dataVersion}
          onMenuOpen={() => setMenuOpen(true)}
        />
      )}

      {currentView === 'RANKING' && (
        <Ranking onNavigate={navigate} />
      )}

      {currentView === 'HISTORY' && (
        <History onNavigate={navigate} />
      )}

      {currentView === 'MY' && (
        <MyPage onNavigate={navigate} />
      )}

      {currentView === 'DETAIL' && (
        <Detail
          person={selectedPerson}
          onBack={() => navigate(activeTab || 'HOME')}
          showToast={showToast}
        />
      )}

      {currentView === 'ANALYSIS' && (
        <Analysis
          url={analysisUrl}
          onBack={() => navigate('HOME')}
          onSaveComplete={refreshData}
          showToast={showToast}
        />
      )}

      {currentView === 'TWEET_ANALYSIS' && (
        <TweetAnalysis
          url={tweetUrl}
          onBack={() => navigate('HOME')}
          onViewPerson={(person) => navigate('DETAIL', person)}
          showToast={showToast}
        />
      )}

      {currentView === 'PORTFOLIO_CHECK' && (
        <PortfolioCheck
          onBack={() => navigate('HOME')}
          showToast={showToast}
        />
      )}

      {/* Bottom Nav — only on main tabs */}
      {showNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => navigate(tab)}
        />
      )}
    </div>
  );
}

export default App;
