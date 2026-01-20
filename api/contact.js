// Vercel Serverless Function for contact form
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    // Parse request body
    const { name, email, message } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Please fill in all required fields' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please enter a valid email address' 
      });
    }
    
    // In a real application, you would:
    // 1. Save to a database
    // 2. Send an email notification
    // 3. Integrate with a CRM
    
    // For demo purposes, we'll just log the data
    console.log('Contact form submission:', { name, email, message });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return success response
    return res.status(200).json({ 
      message: 'Thank you for your message! I will get back to you soon.',
      success: true
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    
    return res.status(500).json({ 
      message: 'Something went wrong. Please try again later.' 
    });
  }
};