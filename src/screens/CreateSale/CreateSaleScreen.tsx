import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../theme';
import { useUserStore } from '../../stores/userStore';
import { useSaleStore } from '../../stores/saleStore';
import { useXPToast } from '../../components/XPToast';
import { createSale } from '../../services/api';
import { analytics } from '../../services/analytics';
import type { CategoryId } from '../../types';

const TIME_OPTIONS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM',
];

// Rough ZIP → lat/lng estimates for Portland-area ZIPs (expand as needed)
const ZIP_ESTIMATES: Record<string, { lat: number; lng: number }> = {
  '97201': { lat: 45.5215, lng: -122.6898 },
  '97202': { lat: 45.4800, lng: -122.6432 },
  '97203': { lat: 45.5916, lng: -122.7475 },
  '97204': { lat: 45.5174, lng: -122.6750 },
  '97205': { lat: 45.5196, lng: -122.6980 },
  '97206': { lat: 45.4760, lng: -122.5990 },
  '97209': { lat: 45.5326, lng: -122.6858 },
  '97210': { lat: 45.5370, lng: -122.7124 },
  '97211': { lat: 45.5724, lng: -122.6422 },
  '97212': { lat: 45.5451, lng: -122.6432 },
  '97213': { lat: 45.5381, lng: -122.5990 },
  '97214': { lat: 45.5145, lng: -122.6432 },
  '97215': { lat: 45.5138, lng: -122.5990 },
  '97216': { lat: 45.5143, lng: -122.5560 },
  '97217': { lat: 45.5900, lng: -122.6900 },
  '97218': { lat: 45.5744, lng: -122.5990 },
  '97219': { lat: 45.4600, lng: -122.6980 },
  '97220': { lat: 45.5518, lng: -122.5560 },
  '97221': { lat: 45.4947, lng: -122.7250 },
  '97222': { lat: 45.4440, lng: -122.6150 },
  '97223': { lat: 45.4434, lng: -122.7780 },
  '97224': { lat: 45.4070, lng: -122.7780 },
  '97225': { lat: 45.5000, lng: -122.7780 },
  '97229': { lat: 45.5390, lng: -122.8180 },
  '97230': { lat: 45.5560, lng: -122.5060 },
  '97231': { lat: 45.6270, lng: -122.8180 },
  '97232': { lat: 45.5340, lng: -122.6432 },
  '97233': { lat: 45.5184, lng: -122.4960 },
  '97236': { lat: 45.4820, lng: -122.5060 },
  '97266': { lat: 45.4650, lng: -122.5560 },
};

function estimateLocation(zip: string): { lat: number; lng: number } {
  const known = ZIP_ESTIMATES[zip];
  if (known) return known;
  // Default: Portland center with small random jitter
  return {
    lat: 45.5152 + (Math.random() - 0.5) * 0.04,
    lng: -122.6784 + (Math.random() - 0.5) * 0.04,
  };
}

export default function CreateSaleScreen({ navigation }: any) {
  const { addXP, addCoins, incrementSalesPosted } = useUserStore();
  const { addPostedSale } = useSaleStore();
  const { showXP, showCoins, showToast, showBadge } = useXPToast();
  const [step, setStep] = useState(0);
  const [posting, setPosting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('8:00 AM');
  const [endTime, setEndTime] = useState('2:00 PM');
  const [categories, setCategories] = useState<CategoryId[]>([]);
  const [tags, setTags] = useState('');

  const toggleCategory = (catId: CategoryId) => {
    if (categories.includes(catId)) {
      setCategories(categories.filter((c) => c !== catId));
    } else if (categories.length < 5) {
      setCategories([...categories, catId]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !address || !city || !state || !zipCode || !startDate) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }

    setPosting(true);
    try {
      const loc = estimateLocation(zipCode);
      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      // Create via API (adds to in-memory cache for current session)
      const newSale = await createSale({
        title,
        description,
        address,
        city,
        state,
        zipCode,
        latitude: loc.lat,
        longitude: loc.lng,
        startDate,
        endDate: endDate || startDate,
        startTime,
        endTime,
        categories,
        tags: tagList,
        photos: [],
      });

      // Persist to local store (survives app restart)
      addPostedSale(newSale);

      // Rewards
      addXP(20);
      addCoins(10);
      incrementSalesPosted();

      // Analytics
      analytics.salePosted(newSale.id);

      // Toasts
      showXP(20);
      setTimeout(() => showCoins(10), 400);
      setTimeout(() => showToast('Sale posted! Hunters can find you now.'), 800);

      // Check if first_sale badge was just awarded
      const { profile } = useUserStore.getState();
      if (profile?.badges.includes('first_sale') && profile.totalSalesPosted === 1) {
        setTimeout(() => showBadge('First Sale!'), 1200);
      }

      navigation.goBack();
    } catch (err) {
      console.error('Failed to post sale:', err);
      Alert.alert('Error', 'Failed to post your sale. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return title.length >= 3 && description.length >= 10;
      case 1: return address && city && state && zipCode;
      case 2: return startDate;
      case 3: return categories.length > 0;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Tell us about your sale</Text>
            <Text style={s.stepDesc}>A catchy title and description help hunters find you.</Text>

            <Text style={s.label}>Sale Title *</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Big Family Estate Sale"
              placeholderTextColor={COLORS.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={60}
            />
            <Text style={s.charCount}>{title.length}/60</Text>

            <Text style={s.label}>Description *</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="What are you selling? Any highlights or deals?"
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={s.charCount}>{description.length}/500</Text>
          </View>
        );

      case 1:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Where is your sale?</Text>
            <Text style={s.stepDesc}>Enter your address so hunters can find you on the map.</Text>

            <Text style={s.label}>Street Address *</Text>
            <TextInput
              style={s.input}
              placeholder="123 Main Street"
              placeholderTextColor={COLORS.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            <View style={s.row}>
              <View style={{ flex: 2, marginRight: SPACING.md }}>
                <Text style={s.label}>City *</Text>
                <TextInput
                  style={s.input}
                  placeholder="Portland"
                  placeholderTextColor={COLORS.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>State *</Text>
                <TextInput
                  style={s.input}
                  placeholder="OR"
                  placeholderTextColor={COLORS.textMuted}
                  value={state}
                  onChangeText={setState}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <Text style={s.label}>ZIP Code *</Text>
            <TextInput
              style={[s.input, { width: 120 }]}
              placeholder="97201"
              placeholderTextColor={COLORS.textMuted}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
              maxLength={5}
            />
            <Text style={s.zipHint}>
              We use your ZIP to pin your sale on the map. Portland-area ZIPs get precise placement.
            </Text>
          </View>
        );

      case 2:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>When is your sale?</Text>
            <Text style={s.stepDesc}>Enter dates and times. Multi-day sales welcome!</Text>

            <Text style={s.label}>Start Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              placeholder="2026-06-14"
              placeholderTextColor={COLORS.textMuted}
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={s.label}>End Date (leave blank for single day)</Text>
            <TextInput
              style={s.input}
              placeholder="2026-06-15"
              placeholderTextColor={COLORS.textMuted}
              value={endDate}
              onChangeText={setEndDate}
            />

            <Text style={s.label}>Start Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timeScroll}>
              {TIME_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.timeChip, startTime === t && s.timeChipActive]}
                  onPress={() => setStartTime(t)}
                >
                  <Text style={[s.timeText, startTime === t && s.timeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>End Time</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timeScroll}>
              {TIME_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.timeChip, endTime === t && s.timeChipActive]}
                  onPress={() => setEndTime(t)}
                >
                  <Text style={[s.timeText, endTime === t && s.timeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Categories & Items</Text>
            <Text style={s.stepDesc}>Pick up to 5 categories. Add item tags to attract buyers.</Text>

            <Text style={s.label}>Categories * ({categories.length}/5)</Text>
            <View style={s.catGrid}>
              {CATEGORIES.map((cat) => {
                const selected = categories.includes(cat.id as CategoryId);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[s.catChip, selected && s.catChipActive]}
                    onPress={() => toggleCategory(cat.id as CategoryId)}
                  >
                    <Text style={[s.catText, selected && s.catTextActive]}>
                      {cat.emoji} {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={s.label}>Item Tags (comma separated)</Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="vintage lamp, kids toys, power tools, vinyl records..."
              placeholderTextColor={COLORS.textMuted}
              value={tags}
              onChangeText={setTags}
              multiline
            />
          </View>
        );

      case 4:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Review Your Sale</Text>
            <Text style={s.stepDesc}>Make sure everything looks good before posting!</Text>

            <View style={s.reviewCard}>
              <Text style={s.reviewLabel}>Title</Text>
              <Text style={s.reviewValue}>{title}</Text>

              <Text style={s.reviewLabel}>Address</Text>
              <Text style={s.reviewValue}>{address}, {city}, {state} {zipCode}</Text>

              <Text style={s.reviewLabel}>Map Pin</Text>
              <Text style={s.reviewValueSmall}>
                {ZIP_ESTIMATES[zipCode]
                  ? `Pinned by ZIP (${zipCode})`
                  : `Estimated near Portland center`}
              </Text>

              <Text style={s.reviewLabel}>Date</Text>
              <Text style={s.reviewValue}>
                {startDate}{endDate ? ` to ${endDate}` : ''} | {startTime} - {endTime}
              </Text>

              <Text style={s.reviewLabel}>Categories</Text>
              <Text style={s.reviewValue}>
                {categories.map((c) => {
                  const cat = CATEGORIES.find((cc) => cc.id === c);
                  return cat ? `${cat.emoji} ${cat.label}` : c;
                }).join(', ')}
              </Text>

              {tags && (
                <>
                  <Text style={s.reviewLabel}>Tags</Text>
                  <Text style={s.reviewValue}>{tags}</Text>
                </>
              )}

              <Text style={s.reviewLabel}>Description</Text>
              <Text style={s.reviewValue}>{description}</Text>
            </View>

            <View style={s.rewardPreview}>
              <Text style={s.rewardTitle}>Rewards for posting:</Text>
              <Text style={s.rewardItem}>+20 XP | +10 Coins | First Sale badge</Text>
            </View>
          </View>
        );
    }
  };

  const TOTAL_STEPS = 5;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress Bar */}
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${((step + 1) / TOTAL_STEPS) * 100}%` }]} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={s.navRow}>
          {step > 0 ? (
            <TouchableOpacity style={s.backBtn} onPress={() => setStep(step - 1)}>
              <Text style={s.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <Text style={s.backBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}

          {step < TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              style={[s.nextBtn, !canProceed() && s.nextBtnDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              <Text style={s.nextBtnText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.submitBtn, posting && s.nextBtnDisabled]}
              onPress={handleSubmit}
              disabled={posting}
            >
              <Text style={s.submitBtnText}>{posting ? 'Posting...' : 'Post Sale'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  progressBar: { height: 4, backgroundColor: COLORS.bgMuted },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  scrollContent: { padding: SPACING.xl, paddingBottom: 40 },
  stepContent: {},
  stepTitle: { color: COLORS.text, fontSize: 22, fontWeight: 'bold', marginBottom: SPACING.sm },
  stepDesc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: SPACING.xl },
  // Inputs
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginTop: SPACING.lg, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { color: COLORS.textMuted, fontSize: 11, textAlign: 'right', marginTop: 4 },
  row: { flexDirection: 'row' },
  zipHint: { color: COLORS.textMuted, fontSize: 11, marginTop: SPACING.sm, fontStyle: 'italic' },
  // Time selector
  timeScroll: { marginTop: SPACING.sm },
  timeChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, marginRight: SPACING.sm,
  },
  timeChipActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  timeText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  timeTextActive: { color: COLORS.primary },
  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  catChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    marginRight: SPACING.sm, marginBottom: SPACING.sm,
  },
  catChipActive: { backgroundColor: COLORS.primaryBg, borderColor: COLORS.primary },
  catText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  catTextActive: { color: COLORS.primaryDark },
  // Review
  reviewCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.border,
  },
  reviewLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', marginTop: SPACING.md, letterSpacing: 0.5 },
  reviewValue: { color: COLORS.text, fontSize: 15, marginTop: 4 },
  reviewValueSmall: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  rewardPreview: {
    backgroundColor: COLORS.primaryBg, borderRadius: RADIUS.md, padding: SPACING.lg,
    marginTop: SPACING.xl, alignItems: 'center',
  },
  rewardTitle: { color: COLORS.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  rewardItem: { color: COLORS.primaryDark, fontSize: 13 },
  // Nav
  navRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.xl,
    borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  backBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl },
  backBtnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  nextBtn: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.md,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: COLORS.textInverse, fontSize: 15, fontWeight: '700' },
  submitBtn: {
    backgroundColor: COLORS.success, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl,
    borderRadius: RADIUS.md,
  },
  submitBtnText: { color: COLORS.textInverse, fontSize: 15, fontWeight: '700' },
});
