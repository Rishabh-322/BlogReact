export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>© {new Date().getFullYear()} Marginal — deployed on Amazon EKS</span>
        <span>Built with Nexus · SonarQube · Trivy · Prometheus</span>
      </div>
    </footer>
  );
}
