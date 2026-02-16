import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, CATEGORIES } from '../../theme';
import { useUserStore } from '../../stores/userStore';
import type { CategoryId } from '../../types';

const TIME_OPTIONS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
  '4:00 PM', '5:00 PM', '6:00 PM',
];

export default function CreateSaleScreen({ navigation }: any) {
  const { profile } = useUserStore();
  const [step, setStep] = useState(0);

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

  const handleSubmit = () => {
    if (!title || !address || !city || !state || !zipCode || !startDate) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    // Simulate posting
    Alert.alert(
      '🎉 Sale Posted!',
      'Your yard sale is now live and visible to nearby hunters. You earned +20 XP!',
      [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
    );
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
            <Text style={s.stepTitle}>📝 Tell us about your sale</Text>
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
            <Text style={s.stepTitle}>📍 Where is your sale?</Text>
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
          </View>
        );

      case 2:
        return (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>📅 When is your sale?</Text>
            <Text style={s.stepDesc}>Enter dates and times. Multi-day sales welcome!</Text>

            <Text style={s.label}>Start Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={s.input}
              placeholder="2025-06-14"
              placeholderTextColor={COLORS.textMuted}
              value={startDate}
              onChangeText={setStartDate}
            />

            <Text style={s.label}>End Date (leave blank for single day)</Text>
            <TextInput
              style={s.input}
              placeholder="2025-06-15"
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
            <Text style={s.stepTitle}>🏷️ Categories & Items</Text>
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
            <Text style={s.stepTitle}>🎯 Review Your Sale</Text>
            <Text style={s.stepDesc}>Make sure everything looks good before posting!</Text>

            <View style={s.reviewCard}>
              <Text style={s.reviewLabel}>Title</Text>
              <Text style={s.reviewValue}>{title}</Text>

              <Text style={s.reviewLabel}>Address</Text>
              <Text style={s.reviewValue}>{address}, {city}, {state} {zipCode}</Text>

              <Text style={s.reviewLabel}>Date</Text>
              <Text style={s.reviewValue}>
                {startDate}{endDate ? ` — ${endDate}` : ''} · {startTime}–{endTime}
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

            <Text style={s.xpHint}>📊 You'll earn +20 XP and +10 coins for posting!</Text>
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
              <Text style={s.backBtnText}>← Back</Text>
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
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.submitBtn} onPress={handleSubmit}>
              <Text style={s.submitBtnText}>🎉 Post Sale</Text>
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
  stepTitle: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: SPACING.sm },
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
  xpHint: { color: COLORS.primary, fontSize: 13, textAlign: 'center', marginTop: SPACING.xl, fontStyle: 'italic' },
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
