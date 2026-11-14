
import "./Footer.css";

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className="footer-brand-icon">I</span>

        <span>
          © {new Date().getFullYear()} <strong>InsightBoard</strong>
        </span>
      </div>

      <div className="footer-right">
        <span className="footer-platform">
          Admin Analytics Platform
        </span>

        <span className="footer-separator">|</span>

        <span className="footer-copyright">
          All rights reserved.
        </span>
      </div>
    </footer>
  );
}

export default Footer;
