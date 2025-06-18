import React, { useState } from 'react';

export default function App() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwA5tEDjwD8XBub1kZLZSG_KsYjPH5FR4zqvRY4Y7DbYOKZ7dUvfhes_ifI6IoOul_ozQ/exec';

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const [activeTab, setActiveTab] = useState('sampling');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [statusMap, setStatusMap] = useState({});
  const [bulkOrders, setBulkOrders] = useState([]);
  const [bulkRemarks, setBulkRemarks] = useState({});
  const [bulkImages, setBulkImages] = useState({});

  const [soNumber, setSoNumber] = useState('');
  const [brand, setBrand] = useState('');
  const [fabricQuality, setFabricQuality] = useState('');
  const [fabricQuantity, setFabricQuantity] = useState('');
  const [image, setImage] = useState(null);
  const [remark, setRemark] = useState('');
  const [inhouseDate, setInhouseDate] = useState('');

  const [sourcingRemarks, setSourcingRemarks] = useState({});
  const [vendorNames, setVendorNames] = useState({});
  const [invoiceFiles, setInvoiceFiles] = useState({});
  const [amounts, setAmounts] = useState({});

  const inputStyle = { width: '100%', margin: '6px 0', padding: '10px', boxSizing: 'border-box' };
  const buttonStyle = { padding: '10px', margin: '6px 6px 10px 0', cursor: 'pointer' };
  const headerStyle = { fontWeight: 'bold', fontSize: '20px', color: '#333' };

  const sendBulkForm = async (formData) => {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Bulk remark submitted!');
  };

  const handleEmailLogin = async () => {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=getRole&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.role === 'creator' || data.role === 'sourcing') {
        setUserType(data.role);
        setIsAuthenticated(true);
        fetchTickets(data.role);
        if (data.role === 'sourcing') fetchBulkOrders(email);
      } else {
        setError('Access denied');
      }
    } catch {
      setError('Login failed');
    }
  };

  const fetchTickets = async (role) => {
    const action = role === 'creator' ? 'getCreatorTickets' : 'getSourcingTickets';
    const res = await fetch(`${SCRIPT_URL}?action=${action}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setTickets(data.reverse());
    fetchStatuses(data.map(t => t['Unique Ticket ID']));
  };

  const fetchStatuses = async (ids) => {
    const map = {};
    for (const id of ids) {
      const res = await fetch(`${SCRIPT_URL}?action=getLogsAndStatus&ticketId=${id}`);
      const data = await res.json();
      map[id] = data.status || {};
    }
    setStatusMap(map);
  };

  const fetchBulkOrders = async (email) => {
    const res = await fetch(`${SCRIPT_URL}?action=getBulkOrders&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setBulkOrders(data);
  };

  const handleSamplingSubmit = async (e) => {
    if (e) e.preventDefault();
    const formData = new URLSearchParams();
    formData.append('action', 'submitTicket');
    formData.append('email', email);
    formData.append('soNumber', soNumber);
    formData.append('brand', brand);
    formData.append('fabricQuality', fabricQuality);
    formData.append('fabricQuantity', fabricQuantity);
    formData.append('remark', remark);
    formData.append('inhouseDate', inhouseDate);
    formData.append('imageName', image ? image.name : '');
    formData.append('imageType', image ? image.type : '');

    if (image) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        formData.append('image', base64);
        submitToScript(formData);
      };
      reader.readAsDataURL(image);
    } else {
      formData.append('image', 'null');
      submitToScript(formData);
    }
  };

  const submitToScript = async (formData) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      });
      alert('Sampling Ticket submitted!');
      setSoNumber('');
      setBrand('');
      setFabricQuality('');
      setFabricQuantity('');
      setImage(null);
      setRemark('');
      setInhouseDate('');
    } catch (err) {
      console.error(err);
      alert('Submission failed.');
    }
  };

  const handleSourcingLog = async (ticketId) => {
    const formData = new URLSearchParams();
    formData.append('action', 'logSourcing');
    formData.append('ticketId', ticketId);
    formData.append('remark', sourcingRemarks[ticketId] || '');
    formData.append('vendorName', vendorNames[ticketId] || '');
    formData.append('amount', amounts[ticketId] || '');

    const file = invoiceFiles[ticketId];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        formData.append('invoiceName', file.name);
        formData.append('invoiceType', file.type);
        formData.append('invoiceBase64', reader.result.split(',')[1]);
        await sendSourcingForm(formData);
      };
      reader.readAsDataURL(file);
    } else {
      formData.append('invoiceBase64', 'null');
      await sendSourcingForm(formData);
    }
  };

  const sendSourcingForm = async (formData) => {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Sourcing log added.');
    fetchTickets(userType);
  };

  const requestClosure = async (ticketId) => {
    const formData = new URLSearchParams();
    formData.append('action', 'requestClosure');
    formData.append('ticketId', ticketId);
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert('Closure requested.');
    fetchTickets(userType);
  };

  const handleClosureResponse = async (ticketId, decision) => {
    const formData = new URLSearchParams();
    formData.append('action', 'respondClosure');
    formData.append('ticketId', ticketId);
    formData.append('response', decision);
    await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });
    alert(`Closure ${decision}d`);
    fetchTickets(userType);
  };

  const handleBulkSubmit = async (uniqueId) => {
    const formData = new URLSearchParams();
    formData.append('action', 'bulkUpdate');
    formData.append('uniqueId', uniqueId);
    formData.append('remark', bulkRemarks[uniqueId] || '');

    const file = bulkImages[uniqueId];

    const resetFields = () => {
      setBulkRemarks(prev => ({ ...prev, [uniqueId]: '' }));
      setBulkImages(prev => ({ ...prev, [uniqueId]: null }));
    };

    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        formData.append('imageBase64', reader.result.split(',')[1]);
        formData.append('imageType', file.type);
        formData.append('imageName', file.name || 'upload.png');
        await sendBulkForm(formData);
        resetFields();
      };
      reader.readAsDataURL(file);
    } else {
      formData.append('imageBase64', 'null');
      await sendBulkForm(formData);
      resetFields();
    }
  };

  // ===== UI START =====
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded mb-4"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            onClick={handleEmailLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
          {error && <p className="text-red-600 text-sm text-center mt-3">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={headerStyle}>
        <h1>Textile Workflow Dashboard</h1>
        <div>
          <span>Logged in as: {userType}</span>{' '}
          <button onClick={() => { setIsAuthenticated(false); setEmail(''); }}>Logout</button>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setActiveTab('sampling')} style={buttonStyle}>Sampling</button>
        <button onClick={() => setActiveTab('bulk')} style={buttonStyle}>Bulk</button>
      </div>

      {/* Add your sampling or bulk UI based on activeTab here */}
      <div style={{ marginTop: 20 }}>
        {/* Sampling form and ticket list go here */}
      </div>
    </div>
  );
}
