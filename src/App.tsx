import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import { ToastProvider } from './components/ui/Toast';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import ToolPage from './pages/ToolPage';
import NotFound from './pages/NotFound';
import { toolsRegistry } from './data/toolsRegistry';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <div className="flex flex-col min-h-screen bg-bg">
          <Header />

          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {toolsRegistry.map(tool => (
                <Route key={tool.id} path={tool.route} element={<ToolPage />} />
              ))}

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>

          <Footer />
          <ScrollToTop />
        </div>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
