function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <strong>Singgul Video</strong>
          <span>Simple video sharing.</span>
        </div>
        <p>© {new Date().getFullYear()} Jeong Jimin</p>
      </div>
    </footer>
  );
}

export default Footer;
