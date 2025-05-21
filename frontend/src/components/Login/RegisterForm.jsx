import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Daftar kelas yang bisa dipilih
const kelasOptions = [
  { value: '', label: 'Pilih Kelas Anda*', disabled: true },
  { value: '10-IPA-1', label: 'Kelas 10-IPA-1' },
  { value: '10-IPA-2', label: 'Kelas 10-IPA-2' },
  { value: '10-IPA-3', label: 'Kelas 10-IPA-3' },
  { value: '10-IPA-4', label: 'Kelas 10-IPA-4' },
  { value: '10-IPA-5', label: 'Kelas 10-IPA-5' },
  { value: '10-IPA-6', label: 'Kelas 10-IPA-6' },
  { value: '10-IPA-7', label: 'Kelas 10-IPA-7' },
  { value: '10-IPA-8', label: 'Kelas 10-IPA-8' },
  { value: '10-IPA-9', label: 'Kelas 10-IPA-9' },
  { value: '11-IPA-1', label: 'Kelas 11-IPA-1' },
  { value: '11-IPA-2', label: 'Kelas 11-IPA-2' },
  { value: '11-IPA-3', label: 'Kelas 11-IPA-3' },
  { value: '11-IPA-4', label: 'Kelas 11-IPA-4' },
  { value: '11-IPA-5', label: 'Kelas 11-IPA-5' },
  { value: '11-IPA-6', label: 'Kelas 11-IPA-6' },
  { value: '11-IPA-7', label: 'Kelas 11-IPA-7' },
  { value: '11-IPA-8', label: 'Kelas 11-IPA-8' },
  { value: '11-IPA-9', label: 'Kelas 11-IPA-9' },
  { value: '12-IPA-1', label: 'Kelas 12-IPA-1' },
  { value: '12-IPA-2', label: 'Kelas 12-IPA-2' },
  { value: '12-IPA-3', label: 'Kelas 12-IPA-3' },
  { value: '12-IPA-4', label: 'Kelas 12-IPA-4' },
  { value: '12-IPA-5', label: 'Kelas 12-IPA-5' },
  { value: '12-IPA-6', label: 'Kelas 12-IPA-6' },
  { value: '12-IPA-7', label: 'Kelas 12-IPA-7' },
  { value: '12-IPA-8', label: 'Kelas 12-IPA-8' },
  { value: '12-IPA-9', label: 'Kelas 12-IPA-9' },
  // Tambahkan opsi kelas lainnya sesuai kebutuhan
];

const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kelas, setKelas] = useState(''); // State kelas, defaultnya string kosong
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (!kelas || kelas === '') {
      setErrorMessage('Kelas wajib dipilih');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password, kelas })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Registration successful! Please login with your new account.');
        navigate('/');
      } else {
        setErrorMessage(data.message || 'Registration failed. Please try different credentials.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Create a New Account</h1>
      <p className="text-gray-600 mb-6">Enter your details to register</p>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username*
          </label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            minLength={3}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address*
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="kelas" className="block text-sm font-medium text-gray-700 mb-1">
            Kelas*
          </label>
          <select
            id="kelas"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            required
            disabled={isLoading}
          >
            {kelasOptions.map(option => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password*
          </label>
          <input
            id="password"
            type="password"
            placeholder="Password (min. 6 characters)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password*
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-blue-600 hover:underline"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            Already have an account? Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;