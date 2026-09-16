type FooterProps = {
  onPrivacy: () => void;
  onTerms: () => void;
};

export default function Footer({ onPrivacy, onTerms }: FooterProps) {
  return (
    <footer className="site-footer">
      <button onClick={onPrivacy}>Privacy Policy</button>
      <span>·</span>
      <button onClick={onTerms}>Terms of Service</button>
    </footer>
  );
}