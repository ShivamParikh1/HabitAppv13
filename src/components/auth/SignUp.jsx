import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Target, Phone, User, MessageSquare } from 'lucide-react';

export default function SignUp() {
  const [step, setStep] = useState('phone'); // 'phone' or 'verify'
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    verificationCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signup, verifyCode, authError, setAuthError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (authError) setAuthError(null);
  };

  const formatPhoneNumber = (phone) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    } else if (digits.startsWith('+')) {
      return phone;
    }
    
    return `+1${digits}`;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setAuthError('Please enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      await signup(formattedPhone, formData.fullName);
      setStep('verify');
    } catch (error) {
      console.error('Send code error:', error);
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!formData.verificationCode.trim()) {
      setAuthError('Please enter the verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyCode(formData.verificationCode, formData.fullName);
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Verify code error:', error);
    }
    setLoading(false);
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);
      await signup(formattedPhone, formData.fullName);
      setAuthError(null);
    } catch (error) {
      console.error('Resend code error:', error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. Redirecting to your dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {step === 'phone' ? 'Create Account' : 'Verify Phone Number'}
          </CardTitle>
          <p className="text-gray-600">
            {step === 'phone' 
              ? 'Join HabitAppV9 and start building better habits'
              : `Enter the verification code sent to ${formData.phoneNumber}`
            }
          </p>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              {authError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{authError}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We'll send you a verification code via SMS
                </p>
              </div>

              <div id="recaptcha-container"></div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {authError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{authError}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label htmlFor="verificationCode">Verification Code</Label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    value={formData.verificationCode}
                    onChange={handleChange}
                    placeholder="Enter 6-digit code"
                    className="pl-10 text-center text-lg tracking-widest"
                    maxLength="6"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify & Create Account'
                )}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-sm"
                >
                  Didn't receive the code? Resend
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('phone')}
                  className="text-sm"
                >
                  Change phone number
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}