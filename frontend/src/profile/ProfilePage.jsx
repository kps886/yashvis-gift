import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const INDIAN_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
    'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
    'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
    'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const emptyAddress = {
    fullName: '', phone: '', line1: '', line2: '',
    city: '', state: 'Maharashtra', pincode: '', country: 'India',
};

// ── Section card ──────────────────────────────────────────────
const Section = ({ title, children }) => (
    <div className="bg-secondary-bg border border-border-color p-6">
        <h2 className="text-lg font-serif mb-5 pb-3 border-b border-border-color"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
        </h2>
        {children}
    </div>
);

// ── Input field helper ────────────────────────────────────────
const Field = ({ label, error, children }) => (
    <div>
        <label className="block text-xs font-bold uppercase tracking-wider
            text-text-secondary mb-1">
            {label}
        </label>
        {children}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
);

const inputCls = (err) =>
    `w-full p-3 bg-primary-bg border rounded text-sm focus:outline-none
     focus:border-accent-gold transition-colors
     ${err ? 'border-red-500' : 'border-border-color'}`;

// ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
    const { user, login } = useAuth();

    // ── Profile form ──────────────────────────────────────────
    const [profile, setProfile]           = useState({ name: '', email: '' });
    const [passwords, setPasswords]       = useState({ current: '', next: '', confirm: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileMsg, setProfileMsg]     = useState({ type: '', text: '' });
    const [profileErrs, setProfileErrs]   = useState({});

    // ── Addresses ─────────────────────────────────────────────
    const [addresses, setAddresses]       = useState([]);
    const [addrLoading, setAddrLoading]   = useState(true);
    const [showAddrForm, setShowAddrForm] = useState(false);
    const [addrForm, setAddrForm]         = useState(emptyAddress);
    const [addrErrs, setAddrErrs]         = useState({});
    const [addrMsg, setAddrMsg]           = useState({ type: '', text: '' });
    const [addrSaving, setAddrSaving]     = useState(false);

    // Load user data
    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await axios.get('/api/users/profile');
                setProfile({ name: data.name, email: data.email });
                setAddresses(data.addresses || []);
            } catch { /* silent */ }
            setAddrLoading(false);
        };
        load();
    }, []);

    // ── Profile update ────────────────────────────────────────
    const validateProfile = () => {
        const e = {};
        if (!profile.name.trim())  e.name  = 'Name is required';
        if (!profile.email.trim()) e.email = 'Email is required';
        if (passwords.next && passwords.next.length < 6)
            e.next = 'Password must be at least 6 characters';
        if (passwords.next && passwords.next !== passwords.confirm)
            e.confirm = 'Passwords do not match';
        setProfileErrs(e);
        return Object.keys(e).length === 0;
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        if (!validateProfile()) return;
        setProfileLoading(true);
        setProfileMsg({ type: '', text: '' });
        try {
            const payload = { name: profile.name, email: profile.email };
            if (passwords.next) payload.password = passwords.next;
            const { data } = await axios.put('/api/users/profile', payload);
            setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
            setPasswords({ current: '', next: '', confirm: '' });
            // refresh token in auth context
            const stored = JSON.parse(localStorage.getItem('charmingUser') || '{}');
            localStorage.setItem('charmingUser', JSON.stringify({ ...stored, ...data }));
        } catch (err) {
            setProfileMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update profile',
            });
        }
        setProfileLoading(false);
    };

    // ── Address helpers ───────────────────────────────────────
    const validateAddr = () => {
        const e = {};
        if (!addrForm.fullName.trim()) e.fullName = 'Required';
        if (!/^\d{10}$/.test(addrForm.phone.replace(/\s/g, '')))
            e.phone = 'Enter a valid 10-digit number';
        if (!addrForm.line1.trim()) e.line1 = 'Required';
        if (!addrForm.city.trim())  e.city  = 'Required';
        if (!/^\d{6}$/.test(addrForm.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
        setAddrErrs(e);
        return Object.keys(e).length === 0;
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        if (!validateAddr()) return;
        setAddrSaving(true);
        setAddrMsg({ type: '', text: '' });
        try {
            const { data } = await axios.post('/api/users/addresses', addrForm);
            setAddresses(data);
            setAddrForm(emptyAddress);
            setShowAddrForm(false);
            setAddrMsg({ type: 'success', text: 'Address added successfully' });
        } catch (err) {
            setAddrMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to add address',
            });
        }
        setAddrSaving(false);
    };

    const handleSetDefault = async (id) => {
        try {
            const { data } = await axios.put(`/api/users/addresses/${id}/default`);
            setAddresses(data);
        } catch {
            setAddrMsg({ type: 'error', text: 'Failed to update default address' });
        }
    };

    const handleDeleteAddress = async (id) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            const { data } = await axios.delete(`/api/users/addresses/${id}`);
            setAddresses(data);
            setAddrMsg({ type: 'success', text: 'Address deleted' });
        } catch {
            setAddrMsg({ type: 'error', text: 'Failed to delete address' });
        }
    };

    const Msg = ({ msg }) => msg.text ? (
        <div className={`p-3 rounded text-sm border ${
            msg.type === 'success'
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-red-500/10 border-red-500/40 text-red-400'
        }`}>
            {msg.text}
        </div>
    ) : null;

    // ─────────────────────────────────────────────────────────
    return (
        <div className="container mx-auto py-10 px-4 max-w-3xl">
            <h1 className="text-3xl font-serif mb-8"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                My Profile
            </h1>

            {/* ── Account Details ── */}
            <Section title="Account Details">
                <form onSubmit={handleProfileSave} className="space-y-4">
                    <Msg msg={profileMsg} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Full Name" error={profileErrs.name}>
                            <input
                                type="text"
                                value={profile.name}
                                onChange={e => {
                                    setProfile({ ...profile, name: e.target.value });
                                    setProfileErrs({ ...profileErrs, name: '' });
                                }}
                                className={inputCls(profileErrs.name)}
                            />
                        </Field>
                        <Field label="Email Address" error={profileErrs.email}>
                            <input
                                type="email"
                                value={profile.email}
                                onChange={e => {
                                    setProfile({ ...profile, email: e.target.value });
                                    setProfileErrs({ ...profileErrs, email: '' });
                                }}
                                className={inputCls(profileErrs.email)}
                            />
                        </Field>
                    </div>

                    <div className="border-t border-border-color pt-4">
                        <p className="text-xs font-bold uppercase tracking-wider
                            text-text-secondary mb-3">
                            Change Password (leave blank to keep current)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="New Password" error={profileErrs.next}>
                                <input
                                    type="password"
                                    placeholder="Min 6 characters"
                                    value={passwords.next}
                                    onChange={e => {
                                        setPasswords({ ...passwords, next: e.target.value });
                                        setProfileErrs({ ...profileErrs, next: '' });
                                    }}
                                    className={inputCls(profileErrs.next)}
                                />
                            </Field>
                            <Field label="Confirm New Password" error={profileErrs.confirm}>
                                <input
                                    type="password"
                                    placeholder="Repeat new password"
                                    value={passwords.confirm}
                                    onChange={e => {
                                        setPasswords({ ...passwords, confirm: e.target.value });
                                        setProfileErrs({ ...profileErrs, confirm: '' });
                                    }}
                                    className={inputCls(profileErrs.confirm)}
                                />
                            </Field>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={profileLoading}
                        className="bg-accent-gold text-primary-bg font-bold px-6 py-2.5
                            text-sm uppercase tracking-wider hover:bg-yellow-500
                            transition-colors disabled:opacity-50"
                    >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </Section>

            {/* ── Saved Addresses ── */}
            <div className="mt-6">
                <Section title="Saved Addresses">
                    <Msg msg={addrMsg} />

                    {addrLoading ? (
                        <p className="text-text-secondary text-sm animate-pulse py-4">
                            Loading addresses...
                        </p>
                    ) : (
                        <>
                            {/* Address cards */}
                            {addresses.length > 0 && (
                                <div className="space-y-3 mb-5">
                                    {addresses.map(addr => (
                                        <div
                                            key={addr._id}
                                            className={`p-4 border rounded transition-colors ${
                                                addr.isDefault
                                                    ? 'border-accent-gold bg-accent-gold/5'
                                                    : 'border-border-color'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="text-sm space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold">{addr.fullName}</p>
                                                        {addr.isDefault && (
                                                            <span className="px-2 py-0.5 text-xs
                                                                bg-accent-gold text-primary-bg
                                                                font-bold rounded uppercase">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-text-secondary">
                                                        {addr.line1}
                                                        {addr.line2 ? `, ${addr.line2}` : ''}
                                                    </p>
                                                    <p className="text-text-secondary">
                                                        {addr.city}, {addr.state} — {addr.pincode}
                                                    </p>
                                                    <p className="text-text-secondary">{addr.phone}</p>
                                                </div>
                                                <div className="flex flex-col gap-2 flex-shrink-0">
                                                    {!addr.isDefault && (
                                                        <button
                                                            onClick={() => handleSetDefault(addr._id)}
                                                            className="text-xs px-2 py-1 border
                                                                border-accent-gold/40 text-accent-gold
                                                                rounded hover:opacity-80 transition-opacity
                                                                whitespace-nowrap"
                                                        >
                                                            Set Default
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteAddress(addr._id)}
                                                        className="text-xs px-2 py-1 border
                                                            border-red-500/40 text-red-400 rounded
                                                            hover:opacity-80 transition-opacity"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add address toggle */}
                            {!showAddrForm ? (
                                <button
                                    onClick={() => {
                                        setShowAddrForm(true);
                                        setAddrMsg({ type: '', text: '' });
                                    }}
                                    className="w-full py-3 border border-dashed border-border-color
                                        text-text-secondary hover:border-accent-gold
                                        hover:text-accent-gold transition-colors text-sm font-semibold"
                                >
                                    + Add New Address
                                </button>
                            ) : (
                                <div className="border border-border-color p-4 mt-2">
                                    <p className="text-sm font-bold uppercase tracking-wider
                                        text-text-secondary mb-4">
                                        New Address
                                    </p>
                                    <form onSubmit={handleAddAddress}
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                                        <Field label="Full Name *" error={addrErrs.fullName}>
                                            <input type="text" value={addrForm.fullName}
                                                onChange={e => {
                                                    setAddrForm({ ...addrForm, fullName: e.target.value });
                                                    setAddrErrs({ ...addrErrs, fullName: '' });
                                                }}
                                                className={inputCls(addrErrs.fullName)} />
                                        </Field>

                                        <Field label="Phone *" error={addrErrs.phone}>
                                            <input type="tel" value={addrForm.phone}
                                                onChange={e => {
                                                    setAddrForm({ ...addrForm, phone: e.target.value });
                                                    setAddrErrs({ ...addrErrs, phone: '' });
                                                }}
                                                className={inputCls(addrErrs.phone)} />
                                        </Field>

                                        <Field label="Address Line 1 *" error={addrErrs.line1}>
                                            <input type="text" value={addrForm.line1}
                                                onChange={e => {
                                                    setAddrForm({ ...addrForm, line1: e.target.value });
                                                    setAddrErrs({ ...addrErrs, line1: '' });
                                                }}
                                                className={`${inputCls(addrErrs.line1)} sm:col-span-2`} />
                                        </Field>

                                        <Field label="Address Line 2">
                                            <input type="text" value={addrForm.line2}
                                                onChange={e => setAddrForm({ ...addrForm, line2: e.target.value })}
                                                className={inputCls()} />
                                        </Field>

                                        <Field label="City *" error={addrErrs.city}>
                                            <input type="text" value={addrForm.city}
                                                onChange={e => {
                                                    setAddrForm({ ...addrForm, city: e.target.value });
                                                    setAddrErrs({ ...addrErrs, city: '' });
                                                }}
                                                className={inputCls(addrErrs.city)} />
                                        </Field>

                                        <Field label="State *">
                                            <select value={addrForm.state}
                                                onChange={e => setAddrForm({ ...addrForm, state: e.target.value })}
                                                className={inputCls()}>
                                                {INDIAN_STATES.map(s =>
                                                    <option key={s} value={s}>{s}</option>
                                                )}
                                            </select>
                                        </Field>

                                        <Field label="Pincode *" error={addrErrs.pincode}>
                                            <input type="text" maxLength={6} value={addrForm.pincode}
                                                onChange={e => {
                                                    setAddrForm({ ...addrForm, pincode: e.target.value });
                                                    setAddrErrs({ ...addrErrs, pincode: '' });
                                                }}
                                                className={inputCls(addrErrs.pincode)} />
                                        </Field>

                                        <Field label="Country">
                                            <input type="text" value={addrForm.country}
                                                onChange={e => setAddrForm({ ...addrForm, country: e.target.value })}
                                                className={inputCls()} />
                                        </Field>

                                        <div className="sm:col-span-2 flex gap-3">
                                            <button type="submit" disabled={addrSaving}
                                                className="bg-accent-gold text-primary-bg font-bold
                                                    px-5 py-2 text-sm uppercase tracking-wider
                                                    hover:bg-yellow-500 transition-colors
                                                    disabled:opacity-50">
                                                {addrSaving ? 'Saving...' : 'Save Address'}
                                            </button>
                                            <button type="button"
                                                onClick={() => {
                                                    setShowAddrForm(false);
                                                    setAddrErrs({});
                                                    setAddrForm(emptyAddress);
                                                }}
                                                className="px-5 py-2 text-sm border border-border-color
                                                    hover:border-text-secondary transition-colors">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </Section>
            </div>
        </div>
    );
};

export default ProfilePage;