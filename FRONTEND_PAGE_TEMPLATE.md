# Frontend Page Template Guide

Use this template as a starting point for creating the remaining Phase 5 pages.

## Page Structure

All pages should follow this structure:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { IconName } from 'lucide-react';  // Import relevant icons
import { fastApiClient } from '@/lib/fastApiClient';
import { useToast } from '@/components/ToastProvider';
import SafetyModal from '@/components/SafetyModal';
import { YourTypes } from '@/lib/types';

export default function YourPage() {
  const { addToast } = useToast();
  const [data, setData] = useState<YourTypes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const result = await fastApiClient.yourApiMethod();
      setData(result);
    } catch (error: any) {
      addToast({ description: `Error: ${error.message}`, variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    try {
      await fastApiClient.yourActionMethod();
      addToast({ description: 'Action completed', variant: 'success' });
      loadData();
    } catch (error: any) {
      addToast({ description: `Error: ${error.message}`, variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <IconName className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Your Page Title</h1>
            <p className="text-sm text-gray-400">Phase 5: Module description</p>
          </div>
        </div>
        <button
          onClick={handleAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
        >
          Action Button
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto space-y-6">
        {/* Your content here */}
      </div>

      {/* Safety Modal for dangerous operations */}
      <SafetyModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        onConfirm={() => {
          // Your dangerous operation
        }}
        level="high-risk"  // or "standard" or "nuclear"
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        confirmText="Confirm"
      />
    </div>
  );
}
```

## Specific Page Examples

### 1. Treasury & Risk Page (`/treasury`)

Key components needed:
- Vault composition display (use grid)
- Exposure metrics
- Risk configuration form
- Kill switch button (use SafetyModal with level="nuclear")

```tsx
// Example structure
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="text-sm text-gray-400">Total Value Locked</div>
    <div className="text-3xl font-bold text-cyan-400">$5.0M</div>
  </div>
  {/* More metrics... */}
</div>

{/* Kill Switch - Nuclear level protection */}
<button
  onClick={() => setShowKillSwitchModal(true)}
  className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold"
>
  🚨 EMERGENCY KILL SWITCH
</button>

<SafetyModal
  isOpen={showKillSwitchModal}
  onClose={() => setShowKillSwitchModal(false)}
  onConfirm={handleKillSwitch}
  level="nuclear"
  title="🚨 DANGER ZONE: GLOBAL TRADING PAUSE"
  message="You are about to PAUSE THE ENTIRE EXCHANGE. This will stop all revenue."
  verificationWord="PAUSE"
/>
```

### 2. Security Page (`/security`)

Key components needed:
- Sybil suspects table
- Action buttons (Shadow Ban, Forgive, Freeze)
- Sentinel flags list
- Audit log viewer

```tsx
// Example structure
<div className="overflow-x-auto">
  <table className="w-full text-sm">
    <thead>
      <tr className="bg-gray-800">
        <th className="px-4 py-2 text-left">User ID</th>
        <th className="px-4 py-2 text-left">Detection Reason</th>
        <th className="px-4 py-2 text-left">Status</th>
        <th className="px-4 py-2 text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      {suspects.map((suspect) => (
        <tr key={suspect.user_id} className="border-b border-gray-800">
          <td className="px-4 py-2">{suspect.user_id}</td>
          <td className="px-4 py-2">{suspect.detection_reason}</td>
          <td className="px-4 py-2">
            {suspect.is_shadow_banned ? (
              <span className="px-2 py-1 bg-red-900/40 text-red-300 rounded">
                Shadow Banned
              </span>
            ) : (
              <span className="px-2 py-1 bg-yellow-900/40 text-yellow-300 rounded">
                Flagged
              </span>
            )}
          </td>
          <td className="px-4 py-2 text-right space-x-2">
            <button
              onClick={() => handleShadowBan(suspect.user_id)}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
            >
              Shadow Ban
            </button>
            <button
              onClick={() => handleForgive(suspect.user_id)}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
            >
              Forgive
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 3. Market Wizard Page (`/market-wizard`)

Key components needed:
- Multi-step wizard (5 steps)
- Form validation
- Image upload (or URL input)
- Outcome configuration
- Batch ID input with validation

```tsx
// Use state to track wizard step
const [step, setStep] = useState(1);
const [formData, setFormData] = useState({
  title: '',
  category: '',
  banner_image_url: '',
  // ... more fields
});

// Render different step content
const renderStep = () => {
  switch (step) {
    case 1:
      return <Step1ContentAndVisuals />;
    case 2:
      return <Step2MarketingBadges />;
    case 3:
      return <Step3DynamicOutcomes />;
    case 4:
      return <Step4LifecycleTiming />;
    case 5:
      return <Step5Oracle />;
    default:
      return null;
  }
};

// Navigation buttons
<div className="flex justify-between mt-6">
  {step > 1 && (
    <button
      onClick={() => setStep(step - 1)}
      className="px-4 py-2 bg-gray-800 rounded-lg"
    >
      Previous
    </button>
  )}
  {step < 5 ? (
    <button
      onClick={() => setStep(step + 1)}
      className="px-4 py-2 bg-blue-600 rounded-lg ml-auto"
    >
      Next
    </button>
  ) : (
    <button
      onClick={handleSubmit}
      className="px-4 py-2 bg-green-600 rounded-lg ml-auto"
    >
      Create Market
    </button>
  )}
</div>
```

### 4. Communications Page (`/communications`)

Key components needed:
- Banner creation form
- Color selector (info_blue, warning_yellow, critical_red)
- Active banner display
- Banner history

```tsx
// Banner form
<div className="bg-gray-800 rounded-lg p-6 space-y-4">
  <h2 className="text-lg font-semibold">Create Global Banner</h2>
  
  <div>
    <label className="block text-sm text-gray-400 mb-2">Message</label>
    <textarea
      value={bannerMessage}
      onChange={(e) => setBannerMessage(e.target.value)}
      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
      rows={3}
    />
  </div>

  <div>
    <label className="block text-sm text-gray-400 mb-2">Color</label>
    <select
      value={bannerColor}
      onChange={(e) => setBannerColor(e.target.value)}
      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
    >
      <option value="info_blue">ℹ️ Info (Blue)</option>
      <option value="warning_yellow">⚠️ Warning (Yellow)</option>
      <option value="critical_red">🚨 Critical (Red)</option>
    </select>
  </div>

  <button
    onClick={handleCreateBanner}
    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg"
  >
    Create Banner
  </button>
</div>
```

### 5. Competitions Page (`/competitions`)

Key components needed:
- Competition creation form
- Economy tuning sliders
- Alliance configuration
- Referral tree viewer

```tsx
// Economy tuning sliders
<div className="bg-gray-800 rounded-lg p-6 space-y-4">
  <h2 className="text-lg font-semibold">Economy Tuning</h2>
  
  <div>
    <label className="block text-sm text-gray-400 mb-2">
      Base Trade XP: {economyConfig.base_trade_xp}
    </label>
    <input
      type="range"
      min="100"
      max="500"
      value={economyConfig.base_trade_xp}
      onChange={(e) => updateConfig('base_trade_xp', Number(e.target.value))}
      className="w-full"
    />
  </div>

  <div>
    <label className="block text-sm text-gray-400 mb-2">
      God Mode Multiplier: {economyConfig.god_mode_multiplier}x
    </label>
    <input
      type="range"
      min="1.0"
      max="5.0"
      step="0.1"
      value={economyConfig.god_mode_multiplier}
      onChange={(e) => updateConfig('god_mode_multiplier', Number(e.target.value))}
      className="w-full"
    />
  </div>

  <button
    onClick={handleUpdateEconomy}
    className="w-full px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
  >
    Update Configuration
  </button>
</div>
```

### 6. CRM Page (`/crm`)

Key components needed:
- Ticket search input
- User lookup
- XP/Streak editor (God Finger)
- Badge granting interface

```tsx
// Search and actions
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Search */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3 className="font-semibold mb-4">Ticket Detective</h3>
    <input
      type="text"
      placeholder="Search by Ticket ID or User ID..."
      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded mb-4"
    />
    <button className="w-full px-4 py-2 bg-blue-600 rounded-lg">
      Search
    </button>
  </div>

  {/* God Finger Tools */}
  <div className="bg-gray-800 rounded-lg p-6">
    <h3 className="font-semibold mb-4">Gamification Editor</h3>
    <div className="space-y-3">
      <button className="w-full px-4 py-2 bg-purple-600 rounded-lg text-left">
        ⚡ Grant XP
      </button>
      <button className="w-full px-4 py-2 bg-purple-600 rounded-lg text-left">
        🔥 Restore Streak
      </button>
      <button className="w-full px-4 py-2 bg-purple-600 rounded-lg text-left">
        🏆 Issue Badge
      </button>
    </div>
  </div>
</div>
```

## Responsive Design Tips

### Mobile-First Approach

Always test on mobile. Use Tailwind responsive prefixes:

```tsx
// Stack on mobile, grid on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Full width on mobile, fixed width on desktop
<div className="w-full md:w-1/2">

// Small text on mobile, larger on desktop
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

### Touch-Friendly Buttons

```tsx
// Ensure buttons are at least 44x44px for touch targets
<button className="px-6 py-3 min-h-[44px] min-w-[44px]">
```

### Overflow Handling

```tsx
// Always handle overflow on tables and long content
<div className="overflow-x-auto">
  <table>...</table>
</div>
```

## Common Patterns

### Loading State

```tsx
if (isLoading) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
    </div>
  );
}
```

### Empty State

```tsx
{data.length === 0 && (
  <div className="bg-gray-800 rounded-lg p-12 text-center">
    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-600" />
    <p className="text-gray-400">No data available</p>
  </div>
)}
```

### Error State

```tsx
{error && (
  <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
    <div className="flex items-center gap-2">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-red-300">{error}</span>
    </div>
  </div>
)}
```

## File Locations

Create your pages in:
- `app/treasury/page.tsx`
- `app/security/page.tsx`
- `app/market-wizard/page.tsx`
- `app/communications/page.tsx`
- `app/competitions/page.tsx`
- `app/crm/page.tsx`

## Testing Checklist

For each page:
- [ ] Loads without errors
- [ ] API calls work correctly
- [ ] Loading states display properly
- [ ] Error handling works
- [ ] Responsive on mobile (< 768px)
- [ ] Responsive on tablet (768px - 1024px)
- [ ] Buttons are touch-friendly
- [ ] Forms validate input
- [ ] SafetyModal works for dangerous actions
- [ ] Toasts display for user feedback

## Additional Resources

- **API Client**: All methods in `lib/fastApiClient.ts`
- **Types**: All types in `lib/types.ts`
- **Icons**: Lucide React icons (https://lucide.dev/)
- **Components**: SafetyModal in `components/SafetyModal.tsx`
- **Toast**: useToast from `components/ToastProvider.tsx`

Good luck! Follow this template and you'll have consistent, professional pages across the entire admin panel.
