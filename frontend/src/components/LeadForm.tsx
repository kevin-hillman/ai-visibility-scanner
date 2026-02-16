'use client';

import { useState } from 'react';
import { submitLead, LeadData } from '@/lib/api';

interface LeadFormProps {
  industryId?: string;
  sourcePage?: string;
  prefill?: {
    company_name?: string;
    message?: string;
  };
}

export default function LeadForm({ industryId, sourcePage, prefill }: LeadFormProps) {
  const [formData, setFormData] = useState(() => ({
    name: '',
    email: '',
    company_name: prefill?.company_name || '',
    phone: '',
    message: prefill?.message || '',
  }));

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      const leadData: LeadData = {
        ...formData,
        industry_id: industryId,
        source_page: sourcePage,
      };

      await submitLead(leadData);
      setStatus('success');

      // Reset form
      setFormData({
        name: '',
        email: '',
        company_name: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (status === 'success') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Vielen Dank!</h3>
        <p className="text-gray-300 mb-6">
          Wir haben Ihre Anfrage erhalten und melden uns innerhalb von 24 Stunden bei Ihnen.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Weitere Anfrage senden
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-rose-400">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Max Mustermann"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            E-Mail <span className="text-rose-400">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="max@unternehmen.de"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company */}
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-300 mb-2">
            Unternehmen
          </label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="Ihre Firma GmbH"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
            Telefon
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            placeholder="+49 123 456789"
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Ihre Nachricht
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          placeholder="Beschreiben Sie kurz Ihr Anliegen..."
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {status === 'submitting' ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Wird gesendet...</span>
          </>
        ) : (
          <span>Kostenlose Erstberatung anfordern</span>
        )}
      </button>

      <p className="text-sm text-gray-400 text-center">
        Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu.
      </p>
    </form>
  );
}
