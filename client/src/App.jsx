import { BrowserRouter as Router } from 'react-router-dom';
import { ShoppingBag, Users, BarChart3, Wallet, Menu } from 'lucide-react';
import { useState, useRef } from 'react';
import './index.css';

// Components
import Sales from './pages/Sales';
import Debts from './pages/Debts';
import Management from './pages/Management';
import Analysis from './pages/Analysis';
import { DataProvider } from './contexts/DataContext';

const NavItem = ({ targetId, icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={() => onClick(targetId)}
      className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
      style={{
        border: 'none',
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--text-main)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
};

const Section = ({ id, children, color, label }) => (
  <section id={id} style={{
    padding: '40px 20px',
    borderTop: `4px solid ${color}`,
    background: `linear-gradient(to bottom, ${color}11, transparent 100px)`,
    borderRadius: '8px 8px 0 0',
    marginBottom: '40px'
  }}>
    <div style={{
      display: 'inline-block',
      background: color,
      color: 'white',
      padding: '5px 15px',
      borderRadius: '0 0 8px 8px',
      fontWeight: 'bold',
      fontSize: '0.8rem',
      marginBottom: '20px',
      transform: 'translateY(-40px)'
    }}>
      {label}
    </div>
    {children}
  </section>
);

const Layout = ({ children, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('sales-section');

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(10px)',
        padding: '1rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <ShoppingBag size={24} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>Vendinha</h1>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', gap: '10px' }} className="desktop-nav">
            <style>{`
               @media (max-width: 768px) {
                 .desktop-nav { display: none !important; }
                 .mobile-toggle { display: block !important; }
               }
               @media (min-width: 769px) {
                 .mobile-toggle { display: none !important; }
               }
             `}</style>
            <NavItem targetId="sales-section" label="Vendas" icon={ShoppingBag} active={activeSection === 'sales-section'} onClick={scrollToSection} />
            <NavItem targetId="debts-section" label="Dívidas" icon={Wallet} active={activeSection === 'debts-section'} onClick={scrollToSection} />
            <NavItem targetId="analysis-section" label="Análise" icon={BarChart3} active={activeSection === 'analysis-section'} onClick={scrollToSection} />
            <NavItem targetId="manage-section" label="Gerenciar" icon={Users} active={activeSection === 'manage-section'} onClick={scrollToSection} />
          </nav>

          <button className="mobile-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', padding: 10 }}>
            <Menu color="var(--primary)" />
          </button>

          {/* Logout Button (Desktop) */}
          <button
            onClick={onLogout}
            className="desktop-nav"
            style={{
              background: 'transparent',
              border: '1px solid #ddd',
              padding: '8px 15px',
              borderRadius: '20px',
              color: '#666',
              cursor: 'pointer',
              marginLeft: '20px'
            }}
            title="Sair"
          >
            Sair
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="card" style={{ position: 'absolute', top: '100%', left: 0, right: 0, margin: '10px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 101 }}>
            <NavItem targetId="sales-section" label="Vendas" icon={ShoppingBag} active={activeSection === 'sales-section'} onClick={scrollToSection} />
            <NavItem targetId="debts-section" label="Dívidas" icon={Wallet} active={activeSection === 'debts-section'} onClick={scrollToSection} />
            <NavItem targetId="analysis-section" label="Análise" icon={BarChart3} active={activeSection === 'analysis-section'} onClick={scrollToSection} />
            <NavItem targetId="manage-section" label="Gerenciar" icon={Users} active={activeSection === 'manage-section'} onClick={scrollToSection} />
          </div>
        )}
      </header>

      <main className="container" style={{ flex: 1, width: '100%', paddingBottom: '80px' }}>
        {children}
      </main>
    </div>
  );
};

// Login Component
const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple hardcoded password or env
    const validPassword = import.meta.env.VITE_APP_PASSWORD || '123456';

    if (password === validPassword) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #722F37 0%, #501b22 100%)',
      color: 'white'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '350px', textAlign: 'center', padding: '40px' }}>
        <div style={{
          width: 80, height: 80,
          background: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          margin: '0 auto 20px auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <ShoppingBag size={40} />
        </div>
        <h1 style={{ color: '#333', marginBottom: '10px' }}>Vendinha</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>Digite a senha de acesso</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Senha (PIN)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1.2rem',
              textAlign: 'center',
              borderRadius: '8px',
              border: error ? '2px solid #dc3545' : '1px solid #ddd',
              marginBottom: '20px',
              outline: 'none'
            }}
            autoFocus
          />
          {error && <div style={{ color: '#dc3545', marginBottom: '15px' }}>Senha incorreta!</div>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('vendinha_auth') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('vendinha_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vendinha_auth');
  };

  if (!isAuthenticated) {
    return (
      <DataProvider>
        <LoginScreen onLogin={handleLogin} />
      </DataProvider>
    );
  }

  return (
    <DataProvider>
      <Router>
        <Layout onLogout={handleLogout}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Section id="sales-section" color="#722F37" label="NOVA VENDA">
              <Sales />
            </Section>

            <Section id="debts-section" color="#722F37" label="CADERNO DE FIADO">
              <Debts />
            </Section>

            <Section id="analysis-section" color="#722F37" label="ANÁLISE E PREVISÃO">
              <Analysis />
            </Section>

            <Section id="manage-section" color="#722F37" label="GERENCIAMENTO (ADM)">
              <details style={{ cursor: 'pointer' }}>
                <summary style={{ padding: '10px', fontWeight: 'bold', color: '#666' }}>Clique para expandir o painel administrativo</summary>
                <div style={{ marginTop: '20px', cursor: 'default' }}>
                  <Management />
                </div>
              </details>
            </Section>
          </div>
        </Layout>
      </Router>
    </DataProvider>
  );
}

export default App;
