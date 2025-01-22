import { useEffect, useState } from 'react';

const PrivacyPolicy = () => {
  const [content, setContent] = useState<string>('');

  useEffect(() => {
    // Fetch the privacy policy HTML file
    fetch('/privacy-policy.html')
      .then(response => response.text())
      .then(html => {
        setContent(html);
      })
      .catch(error => {
        console.error('Error loading privacy policy:', error);
        setContent('<p>Error loading privacy policy.</p>');
      });
  }, []);

  return (
    <div className="privacy-policy-container">
      <div 
        className="privacy-policy-content"
        dangerouslySetInnerHTML={{ __html: content }}
        style={{
          padding: '40px',
          maxWidth: '1200px',
          margin: '0 auto',
          lineHeight: '1.6',
          fontSize: '15px',
          color: '#333',
        }}
      />
    </div>
  );
};

export default PrivacyPolicy;
