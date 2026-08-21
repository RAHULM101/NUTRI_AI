// FILE: mobile/src/screens/main/StoreScreen.js
// Purpose: 100% Exact Mirror of Web NutriStore — Exact Products, Local High-Res Images, Partner Badges, Nutrition Pills Modal, Cart Drawer & Direct Affiliate Links

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShoppingBag, ShoppingCart, Search, X,
  Plus, Minus, ExternalLink, Trash2, CheckCircle2, Package, Sparkles, Star, ShieldCheck, Tag,
  Eye, Flame, Dumbbell, Wheat, Droplets, Clock, Zap
} from 'lucide-react-native';
import { StoreSkeleton } from '../../components/common/SkeletonLoader';
import { triggerHaptic } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';
import { getProducts } from '../../services/storeService';
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../../constants/theme';

const CATEGORIES = [
  { label: 'All',                    slug: '' },
  { label: 'High Protein',           slug: 'high-protein' },
  { label: 'Breakfast',              slug: 'breakfast' },
  { label: 'High Protein Breakfast', slug: 'high-protein-breakfast' },
  { label: 'Muesli',                 slug: 'muesli' },
  { label: 'Healthy Snacks',         slug: 'healthy-snacks' },
  { label: 'Peanut Butter',          slug: 'peanut-butter' },
  { label: 'Dairy & Yogurt',         slug: 'dairy' },
  { label: 'Beverages',              slug: 'beverages' },
  { label: 'Supplements',            slug: 'supplements' },
];

const PARTNER_STYLE = {
  'Blinkit':          { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', emoji: '🟢', color: '#10B981' },
  'Zepto':            { bg: '#FAF5FF', text: '#9333EA', border: '#E9D5FF', emoji: '🟣', color: '#A855F7' },
  'BigBasket':        { bg: '#FEFCE8', text: '#CA8A04', border: '#FEF08A', emoji: '🟡', color: '#EAB308' },
  'Alpino':           { bg: '#FFF7ED', text: '#C2410C', border: '#FFEDD5', emoji: '🥜', color: '#EA580C' },
  'Tata Nutrikorner': { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', emoji: '🍃', color: '#16A34A' },
  'Swiggy Instamart': { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', emoji: '🟠', color: '#FC8019' },
  'Zomato':           { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', emoji: '🔴', color: '#EF4444' },
  'HealthKart':       { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4', emoji: '🩵', color: '#14B8A6' },
};

const LOCAL_PRODUCT_IMAGES = {
  'on_whey': require('../../../assets/products/on_whey.jpg'),
  'mb_whey': require('../../../assets/products/mb_whey.jpg'),
  'alpino_pb': require('../../../assets/products/alpino_peanut_butter.jpg'),
  'epigamia_yogurt': require('../../../assets/products/epigamia_yogurt.jpg'),
  'yogabar': require('../../../assets/products/yogabar_protein_bar.jpg'),
  'true_elements_oats': require('../../../assets/products/true_elements_oats.jpg'),
  'farmley_makhana': require('../../../assets/products/farmley_makhana.jpg'),
  'mb_creatine': require('../../../assets/products/mb_creatine.jpg'),
  'true_elements_granola': require('../../../assets/products/true_elements_granola.jpg'),
  'tetley_tea': require('../../../assets/products/tetley_green_tea.jpg'),
};

export function getProductImageSource(item) {
  const name = (item?.name || '').toLowerCase();
  if (name.includes('peanut butter') || name.includes('alpino') || name.includes('pintola')) return LOCAL_PRODUCT_IMAGES.alpino_pb;
  if (name.includes('creatine')) return LOCAL_PRODUCT_IMAGES.mb_creatine;
  if (name.includes('whey') && name.includes('muscleblaze')) return LOCAL_PRODUCT_IMAGES.mb_whey;
  if (name.includes('whey') || name.includes('gold standard')) return LOCAL_PRODUCT_IMAGES.on_whey;
  if (name.includes('muesli') || name.includes('granola')) return LOCAL_PRODUCT_IMAGES.true_elements_granola;
  if (name.includes('oat') || name.includes('oats') || name.includes('quaker')) return LOCAL_PRODUCT_IMAGES.true_elements_oats;
  if (name.includes('yogurt') || name.includes('epigamia')) return LOCAL_PRODUCT_IMAGES.epigamia_yogurt;
  if (name.includes('makhana') || name.includes('farmley')) return LOCAL_PRODUCT_IMAGES.farmley_makhana;
  if (name.includes('tea') || name.includes('tetley')) return LOCAL_PRODUCT_IMAGES.tetley_tea;
  if (name.includes('bar') || name.includes('yoga')) return LOCAL_PRODUCT_IMAGES.yogabar;
  return LOCAL_PRODUCT_IMAGES.on_whey;
}

const EXACT_WEB_PRODUCTS = [
  {
    id: 1,
    name: 'True Elements Rolled Oats (1kg)',
    brand: 'True Elements',
    partner_name: 'Blinkit',
    website_name: 'Blinkit',
    category: 'breakfast',
    category_name: 'Breakfast',
    price: 253,
    original_price: 400,
    delivery_eta: '10 mins',
    is_featured: true,
    macro_tag: 'Whole Grain • High Fiber',
    description:
      'True Elements Wholegrain Rolled Oats made from rolled oats and suitable for everyday breakfast.',
    nutrition: {
      calories: '363 kcal',
      protein: '13.1g',
      carbs: '65g',
      fat: '7.8g'
    },
    affiliate_link:
      'https://blinkit.com/prn/true-elements-wholegrain-rolled-oats/prid/473034?utm_source=chatgpt.com',
    image_link:
      'https://true-elements.com/products/rolled-oats-1kg?utm_source=chatgpt.com',
    verified: true
  },
  {
    id: 2,
    name: 'MuscleBlaze Biozyme Performance Whey (Rich Chocolate 1kg)',
    brand: 'HealthKart',
    partner_name: 'HealthKart',
    category: 'high-protein',
    category_name: 'High Protein',
    price: 2899,
    original_price: 3399,
    delivery_eta: 'Same Day',
    is_featured: true,
    macro_tag: '25g Protein • Enhanced Absorption',
    description: 'Clinically tested 25g protein per serving and fortified with DigeZyme enzyme complex for 50% higher protein absorption.',
    nutrition: { calories: '113 kcal', protein: '25g', carbs: '2.5g', fat: '1g' },
    affiliate_link: 'https://www.healthkart.com',
    image_link: 'https://www.healthkart.com',
    verified: true
  },
  {
    id: 3,
    name: 'Epigamia Natural Greek Yogurt (400g)',
    brand: 'Epigamia',
    partner_name: 'BigBasket',
    website_name: 'BigBasket',
    category: 'dairy',
    category_name: 'Dairy & Yogurt',
    price: 223,
    original_price: 250,
    delivery_eta: 'Available according to location',
    is_featured: true,
    macro_tag: 'Greek Yogurt • High Protein',
    description:
      'Epigamia Natural Greek Yogurt, 400g cup.',
    nutrition: {
      calories: '65 kcal',
      protein: '7g',
      carbs: '5g',
      fat: '2g'
    },
    affiliate_link:
      'https://www.bigbasket.com/pd/40103424/epigamia-greek-yogurt-natural-low-fat-400-g-cup/?utm_source=chatgpt.com',
    image_link:
      'https://www.bigbasket.com/pd/40103424/epigamia-greek-yogurt-natural-low-fat-400-g-cup/?utm_source=chatgpt.com',
    verified: true
  },
  {
    id: 4,
    name: 'Yoga Bar 20g Protein Bar - Chocolate Brownie',
    brand: 'Yoga Bar',
    partner_name: 'BigBasket',
    website_name: 'BigBasket',
    category: 'healthy-snacks',
    category_name: 'Healthy Snacks',
    price: 749,
    original_price: null,
    delivery_eta: 'Available according to location',
    is_featured: false,
    macro_tag: '20g Protein • High Fibre',
    description:
      'Yoga Bar Chocolate Brownie Protein Bar, 20g protein per bar.',
    nutrition: {
      calories: '299 kcal',
      protein: '20g',
      carbs: '30.8g',
      fat: '11.9g'
    },
    affiliate_link:
      'https://www.bigbasket.com/pd/40095298/yoga-bar-whey-protein-bar-chocolate-brownie-60-g-box/',
    image_link:
      'https://cdn.grofers.com/app/images/products/sliding_image/424391a.jpg?ts=1690816007',
    verified: true
  },
  {
    id: 5,
    name: 'Farmley Prasadam Makhana (Foxnuts) 100g',
    brand: 'Farmley',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'healthy-snacks',
    category_name: 'Healthy Snacks',
    price: 173,
    original_price: 299,
    delivery_eta: 'Available according to location',
    is_featured: false,
    macro_tag: 'Makhana • Healthy Snack',
    description:
      'Farmley Prasadam Makhana (Foxnuts), 100g pack.',
    nutrition: {
      calories: '350 kcal',
      protein: '9.7g',
      carbs: '64g',
      fat: '1.2g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/farmley-prasadam-makhana-foxnuts/pvid/2d4a5eba-80a2-4382-ad26-efb6100a18e2',
    image_link:
      'https://www.zepto.com/pn/farmley-prasadam-makhana-foxnuts/pvid/2d4a5eba-80a2-4382-ad26-efb6100a18e2',
    verified: true
  },
  {
    id: 6,
    name: 'Pintola All Natural Peanut Butter Crunchy (1kg)',
    brand: 'Pintola',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'peanut-butter',
    category_name: 'Peanut Butter',
    price: 383,
    original_price: 430,
    delivery_eta: 'Same Day',
    is_featured: false,
    macro_tag: '30g Protein • 100% Roasted Peanuts',
    description:
      'Pintola All Natural Peanut Butter Crunchy made from pure roasted peanuts with no added sugar or salt.',
    nutrition: {
      calories: '639 kcal',
      protein: '30g',
      carbs: '18g',
      fat: '49g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/pintola-all-natural-peanut-butter-crunchy/pvid/58b1451e-7330-4886-a914-724616c8d9ca',
    image_link:
      'https://www.zepto.com/pn/pintola-all-natural-peanut-butter-crunchy/pvid/58b1451e-7330-4886-a914-724616c8d9ca',
    verified: true
  },
  {
    id: 7,
    name: 'Alpino Natural Peanut Butter Crunch (1kg)',
    brand: 'Alpino',
    partner_name: 'Alpino',
    website_name: 'Alpino Official Store',
    category: 'peanut-butter',
    category_name: 'Peanut Butter',
    price: 349,
    original_price: 419,
    delivery_eta: 'According to pincode',
    is_featured: false,
    macro_tag: '30g Protein • 100% Natural',
    description:
      'Alpino Natural Peanut Butter Crunch made from 100% roasted peanuts with no added sugar, salt or palm oil.',
    nutrition: {
      calories: '620 kcal',
      protein: '30g',
      carbs: '18g',
      fat: '49g'
    },
    affiliate_link:
      'https://alpino.store/collections/peanut-butter/products/alpino-natural-peanut-butter-crunch',
    image_link:
      'https://alpino.store/collections/peanut-butter/products/alpino-natural-peanut-butter-crunch',
    verified: true
  },
  {
    id: 8,
    name: 'Tetley Long Leaf Green Tea (100g)',
    brand: 'Tetley',
    partner_name: 'Tata Nutrikorner',
    website_name: 'Tata Nutrikorner',
    category: 'beverages',
    category_name: 'Beverages',
    price: 190,
    original_price: 225,
    delivery_eta: 'According to pincode',
    is_featured: false,
    macro_tag: 'Green Tea • Antioxidants',
    description:
      'Tetley Long Leaf Green Tea 100g.',
    nutrition: {
      calories: '0 kcal',
      protein: '0g',
      carbs: '0g',
      fat: '0g'
    },
    affiliate_link:
      'https://www.tatanutrikorner.com/products/tetley-green-leaf',
    image_link:
      'https://www.tatanutrikorner.com/products/tetley-green-leaf',
    verified: true
  },
  {
    id: 9,
    name: 'True Elements Dark Chocolate Granola (400g)',
    brand: 'True Elements',
    partner_name: 'Blinkit',
    website_name: 'Blinkit',
    category: 'breakfast',
    category_name: 'Breakfast',
    price: 255,
    original_price: 260,
    delivery_eta: 'Available according to location',
    is_featured: false,
    macro_tag: 'Oats • Seeds • Dark Chocolate',
    description:
      'True Elements Dark Chocolate Granola made with rolled oats, seeds and dried fruit.',
    nutrition: {
      calories: '430 kcal',
      protein: '10.5g',
      carbs: '62g',
      fat: '14.8g'
    },
    affiliate_link:
      'https://blinkit.com/prn/x/prid/532241',
    image_link:
      'https://prithvienterprises.co.in/products/true-elements-dark-chocolate-granola-400-g',
    verified: true
  },
  {
    id: 10,
    name: 'Quaker Rolled Instant Oats (1.5kg)',
    brand: 'Quaker',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'breakfast',
    category_name: 'Breakfast',
    price: 283,
    original_price: 312,
    delivery_eta: 'Fast Delivery',
    is_featured: false,
    macro_tag: 'Whole Grain • High Fibre',
    description:
      'Quaker Rolled Instant Oats made from premium whole grain oats and suitable for everyday breakfast.',
    nutrition: {
      calories: '407 kcal',
      protein: '11.8g',
      carbs: '68.5g',
      fat: '9.5g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/quaker-oats/pvid/b5bd9583-7356-457d-b64a-9a5c8b658d84',
    image_link:
      'https://www.zepto.com/pn/quaker-oats/pvid/b5bd9583-7356-457d-b64a-9a5c8b658d84',
    verified: true
  },
  {
    id: 11,
    name: 'Quaker Rolled Instant Oats (1kg)',
    brand: 'Quaker',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'breakfast',
    category_name: 'Breakfast',
    price: 175,
    original_price: 210,
    delivery_eta: 'Fast Delivery',
    is_featured: false,
    macro_tag: 'Whole Grain • High Protein',
    description:
      'Quaker Rolled Instant Oats made from wholegrain rolled oat flakes and suitable for a quick breakfast.',
    nutrition: {
      calories: '407 kcal',
      protein: '11.8g',
      carbs: '68.5g',
      fat: '9.5g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/quaker-rolled-instant-oats-high-protein-breakfast-cereal/pvid/e3c72ece-b8f3-4443-b12c-500be91dc767',
    image_link:
      'https://www.zepto.com/pn/quaker-rolled-instant-oats-high-protein-breakfast-cereal/pvid/e3c72ece-b8f3-4443-b12c-500be91dc767',
    verified: true
  },
  {
    id: 12,
    name: 'Alpino 25g High Protein Super Oats Chocolate with Almonds & Raisins (1kg)',
    brand: 'Alpino',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'high-protein-breakfast',
    category_name: 'High Protein Breakfast',
    price: 437,
    original_price: 519,
    delivery_eta: 'Same Day',
    is_featured: true,
    macro_tag: '25g Protein • No Added Sugar & Salt',
    description:
      'Alpino High Protein Super Oats with chocolate, almonds and raisins, made with rolled oats, peanut butter, cocoa and nuts and seeds.',
    nutrition: {
      calories: '451 kcal',
      protein: '25g',
      carbs: '56g',
      fat: '16.5g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/alpino-peanut-butter-super-oats-chocolate/pvid/c799ecc3-fc6f-42f7-9b26-c55059ba2545',
    image_link:
      'https://www.zepto.com/pn/alpino-peanut-butter-super-oats-chocolate/pvid/c799ecc3-fc6f-42f7-9b26-c55059ba2545',
    verified: true
  },
  {
    id: 13,
    name: 'Alpino High Protein Super Rolled Oats Honey (1kg)',
    brand: 'Alpino',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'high-protein-breakfast',
    category_name: 'High Protein Breakfast',
    price: 237,
    original_price: 249,
    delivery_eta: 'Fast Delivery',
    is_featured: false,
    macro_tag: '15g Protein • High Fibre',
    description:
      'Alpino High Protein Super Rolled Oats Honey made with rolled oats, honey and unsweetened peanut butter.',
    nutrition: {
      calories: '386 kcal',
      protein: '15g',
      carbs: '61g',
      fat: '11g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/alpino-high-protein-super-rolled-oats-honey/pvid/984be424-308b-40ba-ba1c-49d23c5c0640',
    image_link:
      'https://www.zepto.com/pn/alpino-high-protein-super-rolled-oats-honey/pvid/984be424-308b-40ba-ba1c-49d23c5c0640',
    verified: true
  },
  {
    id: 14,
    name: 'True Elements Fruit & Nut Muesli (1kg)',
    brand: 'True Elements',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'muesli',
    category_name: 'Muesli',
    price: 437,
    original_price: 615,
    delivery_eta: 'Fast Delivery',
    is_featured: true,
    macro_tag: 'Real Fruits & Nuts • Fibre Rich',
    description:
      'True Elements Fruit & Nut Muesli made with rolled oats, wheat flakes, millets, almonds, seeds and dried fruits.',
    nutrition: {
      calories: '400 kcal',
      protein: '9.38g',
      carbs: '77.2g',
      fat: '6.4g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/true-elements-fruit-nut-muesli/pvid/c01f0e14-25c1-4599-b228-e2f66904debe',
    image_link:
      'https://www.zepto.com/pn/true-elements-fruit-nut-muesli/pvid/c01f0e14-25c1-4599-b228-e2f66904debe',
    verified: true
  },
  {
    id: 15,
    name: 'True Elements No Added Sugar Muesli Fruit & Nut (400g)',
    brand: 'True Elements',
    partner_name: 'Zepto',
    website_name: 'Zepto',
    category: 'muesli',
    category_name: 'Muesli',
    price: 240,
    original_price: 350,
    delivery_eta: 'Fast Delivery',
    is_featured: false,
    macro_tag: '13.5g Protein • 11.5g Fibre',
    description:
      'True Elements Fruit & Nut Muesli made with real fruits and nuts, whole grains and no added sugar.',
    nutrition: {
      calories: '425.4 kcal',
      protein: '13.5g',
      carbs: '68.1g',
      fat: '10.9g'
    },
    affiliate_link:
      'https://www.zepto.com/pn/true-elements-no-added-sugar-muesli-fruit-nut-muesli-rich-in-protein-fibre/pvid/22065015-d70f-4952-b5aa-447cd2681a84',
    image_link:
      'https://www.zepto.com/pn/true-elements-no-added-sugar-muesli-fruit-nut-muesli-rich-in-protein-fibre/pvid/22065015-d70f-4952-b5aa-447cd2681a84',
    verified: true
  },
  {
    id: 16,
    name: 'True Elements Fruits, Nuts & Seeds Muesli (1kg)',
    brand: 'True Elements',
    partner_name: 'Blinkit',
    website_name: 'Blinkit',
    category: 'muesli',
    category_name: 'Muesli',
    price: 422,
    original_price: 615,
    delivery_eta: 'Available according to location',
    is_featured: false,
    macro_tag: '13g Protein • Fruits & Nuts',
    description:
      'True Elements Fruits, Nuts & Seeds Muesli made with real fruits, nuts, seeds and whole grains.',
    nutrition: {
      calories: '418 kcal',
      protein: '13g',
      carbs: '66.5g',
      fat: '11.2g'
    },
    affiliate_link:
      'https://blinkit.com/prn/true-elements-fruit-and-nut-muesli/prid/473004',
    image_link:
      'https://blinkit.com/prn/true-elements-fruit-and-nut-muesli/prid/473004',
    verified: true
  },
  {
    id: 17,
    name: 'True Elements High Protein Fruit, Nuts & Seeds Muesli (400g)',
    brand: 'True Elements',
    partner_name: 'Blinkit',
    website_name: 'Blinkit',
    category: 'high-protein-breakfast',
    category_name: 'High Protein Breakfast',
    price: 299,
    original_price: 370,
    delivery_eta: 'Available according to location',
    is_featured: true,
    macro_tag: 'High Protein • Fruits & Nuts',
    description:
      'True Elements High Protein Fruit, Nuts & Seeds Muesli, a convenient high-protein breakfast option.',
    nutrition: {
      calories: '445 kcal',
      protein: '20g',
      carbs: '54.5g',
      fat: '16.8g'
    },
    affiliate_link:
      'https://blinkit.com/prn/true-elements-high-protein-fruit-nuts-seeds-muesli/prid/776005',
    image_link:
      'https://blinkit.com/prn/true-elements-high-protein-fruit-nuts-seeds-muesli/prid/776005',
    verified: true
  },
  {
    id: 18,
    name: 'Yoga Bar Fruits + Nuts & Seeds Muesli (700g)',
    brand: 'Yoga Bar',
    partner_name: 'Blinkit',
    website_name: 'Blinkit',
    category: 'muesli',
    category_name: 'Muesli',
    price: 296,
    original_price: 399,
    delivery_eta: 'Available according to location',
    is_featured: false,
    macro_tag: '13g Protein • Fruits & Seeds',
    description:
      'Yoga Bar Fruits, Nuts & Seeds Muesli made for a convenient breakfast.',
    nutrition: {
      calories: '412 kcal',
      protein: '13g',
      carbs: '67g',
      fat: '10.5g'
    },
    affiliate_link:
      'https://blinkit.com/prn/x/prid/438608',
    image_link:
      'https://blinkit.com/prn/x/prid/438608',
    verified: true
  }
];

// ── Product Card Component ─────────────────────────────────────
function ProductCard({ item, onQuickView, onAddToCart, colors, isDark }) {
  const ps = PARTNER_STYLE[item.partner_name] || { bg: 'rgba(20,184,166,0.1)', text: COLORS.teal, border: 'rgba(20,184,166,0.3)', emoji: '🏪' };
  const imageSource = getProductImageSource(item);

  return (
    <Pressable
      style={({ pressed }) => [
        prodStyles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border },
        pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] },
      ]}
      onPress={() => onQuickView(item)}
    >
      <View style={[prodStyles.imageContainer, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
        <Image source={imageSource} style={prodStyles.image} resizeMode="cover" />

        {/* Partner Badge */}
        <View style={[prodStyles.partnerBadge, { backgroundColor: ps.bg, borderColor: ps.border }]}>
          <Text style={[prodStyles.partnerText, { color: ps.text }]}>
            {ps.emoji} {item.partner_name}
          </Text>
        </View>

        {/* Featured Badge */}
        {item.is_featured && (
          <View style={prodStyles.featuredBadge}>
            <Star size={9} color="#fff" fill="#fff" />
            <Text style={prodStyles.featuredText}>FEATURED</Text>
          </View>
        )}
      </View>

      <View style={prodStyles.body}>
        <View style={prodStyles.metaRow}>
          {item.category_name && (
            <Text style={[prodStyles.categoryText, { color: colors.textMuted }]}>
              {item.category_name.toUpperCase()}
            </Text>
          )}
          {item.macro_tag && (
            <View style={[prodStyles.macroTagWrap, { backgroundColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.10)', borderColor: isDark ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.25)' }]}>
              <Text style={prodStyles.macroTagText} numberOfLines={1}>{item.macro_tag}</Text>
            </View>
          )}
        </View>

        <Text style={[prodStyles.name, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>

        {item.delivery_eta && (
          <Text style={[prodStyles.etaText, { color: colors.textMuted }]}>
            ⚡ {item.delivery_eta} via {item.partner_name}
          </Text>
        )}

        <View style={prodStyles.footer}>
          <View>
            <Text style={[prodStyles.price, { color: colors.text }]}>₹{item.price}</Text>
            {item.original_price && (
              <Text style={prodStyles.origPrice}>₹{item.original_price}</Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pressable
              style={({ pressed }) => [
                prodStyles.quickViewBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onQuickView(item);
              }}
            >
              <Eye size={14} color={colors.textSecondary} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [prodStyles.addCartBtn, pressed && { opacity: 0.85 }]}
              onPress={(e) => {
                e.stopPropagation();
                triggerHaptic('medium');
                onAddToCart(item);
              }}
            >
              <Plus size={14} color="#ffffff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ── Product Detail Popup Modal ─────────────────────────────────
function ProductDetailModal({ visible, product, onClose, onAddToCart, isDark, colors }) {
  if (!visible || !product) return null;

  const ps = PARTNER_STYLE[product.partner_name] || { bg: 'rgba(20,184,166,0.1)', text: COLORS.teal, border: 'rgba(20,184,166,0.3)', emoji: '🏪', color: COLORS.teal };
  const imageSource = getProductImageSource(product);

  const handleBuyNow = () => {
    const targetUrl = product.affiliate_link || `https://www.google.com/search?q=${encodeURIComponent(product.name)}`;
    Linking.openURL(targetUrl).catch(() =>
      Alert.alert('Redirecting', `Opening ${product.partner_name}...`)
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={[modalStyles.dialog, { backgroundColor: colors.bgCard, borderColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[modalStyles.partnerTag, { backgroundColor: ps.bg, borderColor: ps.border }]}>
                <Text style={[modalStyles.partnerTagText, { color: ps.text }]}>{ps.emoji} {product.partner_name}</Text>
              </View>
              {product.delivery_eta && (
                <Text style={[modalStyles.deliveryText, { color: colors.textMuted }]}>⚡ {product.delivery_eta}</Text>
              )}
            </View>
            <Pressable style={modalStyles.closeBtn} onPress={onClose} hitSlop={8}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={modalStyles.scrollBody}>
            {/* Large Product Image */}
            <View style={[modalStyles.imageWrap, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
              <Image source={imageSource} style={modalStyles.image} resizeMode="cover" />
            </View>

            {/* Product Title & Macro Tag */}
            <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
              <Text style={[modalStyles.title, { color: colors.text }]}>{product.name}</Text>
              {product.macro_tag && (
                <View style={[modalStyles.macroTagPill, { backgroundColor: isDark ? 'rgba(20,184,166,0.18)' : 'rgba(20,184,166,0.10)', borderColor: isDark ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.25)' }]}>
                  <Text style={modalStyles.macroTagPillText}>{product.macro_tag}</Text>
                </View>
              )}

              {/* Nutrition Grid Pills */}
              <View style={modalStyles.nutritionRow}>
                <View style={[modalStyles.nutriPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <Flame size={15} color="#EF4444" />
                  <Text style={[modalStyles.nutriVal, { color: colors.text }]}>{product.nutrition?.calories || '—'}</Text>
                  <Text style={[modalStyles.nutriLab, { color: colors.textMuted }]}>CALORIES</Text>
                </View>
                <View style={[modalStyles.nutriPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <Dumbbell size={15} color="#10B981" />
                  <Text style={[modalStyles.nutriVal, { color: colors.text }]}>{product.nutrition?.protein || '—'}</Text>
                  <Text style={[modalStyles.nutriLab, { color: colors.textMuted }]}>PROTEIN</Text>
                </View>
                <View style={[modalStyles.nutriPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <Wheat size={15} color="#F59E0B" />
                  <Text style={[modalStyles.nutriVal, { color: colors.text }]}>{product.nutrition?.carbs || '—'}</Text>
                  <Text style={[modalStyles.nutriLab, { color: colors.textMuted }]}>CARBS</Text>
                </View>
                <View style={[modalStyles.nutriPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC', borderColor: colors.border }]}>
                  <Droplets size={15} color="#3B82F6" />
                  <Text style={[modalStyles.nutriVal, { color: colors.text }]}>{product.nutrition?.fat || '—'}</Text>
                  <Text style={[modalStyles.nutriLab, { color: colors.textMuted }]}>FAT</Text>
                </View>
              </View>

              {/* Description */}
              <Text style={[modalStyles.desc, { color: colors.textSecondary }]}>
                {product.description}
              </Text>
            </View>
          </ScrollView>

          {/* Sticky Modal Bottom Action Bar */}
          <View style={[modalStyles.actionBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border }]}>
            <View>
              <Text style={[modalStyles.actionPrice, { color: colors.text }]}>₹{product.price}</Text>
              {product.original_price && (
                <Text style={modalStyles.actionOrigPrice}>₹{product.original_price}</Text>
              )}
            </View>

            <View style={modalStyles.actionBtns}>
              <Pressable
                style={({ pressed }) => [modalStyles.addCartModalBtn, { borderColor: COLORS.teal }, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  triggerHaptic('medium');
                  onAddToCart(product);
                  onClose();
                }}
              >
                <ShoppingCart size={15} color={COLORS.teal} />
                <Text style={modalStyles.addCartModalText}>Add to Cart</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [modalStyles.buyNowBtn, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  triggerHaptic('success');
                  handleBuyNow();
                }}
              >
                <ExternalLink size={14} color="#fff" />
                <Text style={modalStyles.buyNowText}>Buy Now</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Cart Drawer Modal ──────────────────────────────────────────
function CartDrawerModal({ visible, cart, onClose, onUpdateQty, onRemoveItem, onCheckout, isDark, colors }) {
  if (!visible) return null;

  const total = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={cartStyles.backdrop}>
        <View style={[cartStyles.drawer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={cartStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={19} color={COLORS.teal} />
              <Text style={[cartStyles.title, { color: colors.text }]}>Your Cart ({cart.length})</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {cart.length === 0 ? (
            <View style={cartStyles.emptyWrap}>
              <Package size={48} color={colors.textMuted} />
              <Text style={[cartStyles.emptyTitle, { color: colors.text }]}>Cart is Empty</Text>
              <Text style={[cartStyles.emptySub, { color: colors.textMuted }]}>Add high-protein snacks & supplements to checkout.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
              {cart.map((it) => (
                <View key={it.id} style={[cartStyles.itemRow, { borderColor: colors.border }]}>
                  <Image source={getProductImageSource(it)} style={cartStyles.itemImg} resizeMode="cover" />
                  <View style={{ flex: 1, marginHorizontal: 12 }}>
                    <Text style={[cartStyles.itemName, { color: colors.text }]} numberOfLines={1}>{it.name}</Text>
                    <Text style={[cartStyles.itemPartner, { color: colors.textMuted }]}>{it.partner_name} • ₹{it.price}</Text>
                  </View>
                  <View style={cartStyles.qtyWrap}>
                    <Pressable
                      style={[cartStyles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        triggerHaptic('light');
                        if (it.quantity <= 1) onRemoveItem(it.id);
                        else onUpdateQty(it.id, it.quantity - 1);
                      }}
                    >
                      {it.quantity === 1 ? <Trash2 size={12} color="#EF4444" /> : <Minus size={12} color={colors.text} />}
                    </Pressable>
                    <Text style={[cartStyles.qtyNum, { color: colors.text }]}>{it.quantity}</Text>
                    <Pressable
                      style={[cartStyles.qtyBtn, { borderColor: colors.border }]}
                      onPress={() => {
                        triggerHaptic('light');
                        onUpdateQty(it.id, it.quantity + 1);
                      }}
                    >
                      <Plus size={12} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {cart.length > 0 && (
            <View style={[cartStyles.footer, { borderTopColor: colors.border }]}>
              <View style={cartStyles.totalRow}>
                <Text style={[cartStyles.totalLabel, { color: colors.textMuted }]}>Total Amount</Text>
                <Text style={[cartStyles.totalValue, { color: colors.text }]}>₹{total.toLocaleString('en-IN')}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [cartStyles.checkoutBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  triggerHaptic('success');
                  onCheckout();
                }}
              >
                <Text style={cartStyles.checkoutBtnText}>Checkout Partner Stores →</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Main StoreScreen ───────────────────────────────────────────
export default function StoreScreen() {
  const { isDark, colors } = useTheme();

  const [products, setProducts] = useState(EXACT_WEB_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    getProducts()
      .then((res) => {
        if (res?.products && Array.isArray(res.products) && res.products.length >= EXACT_WEB_PRODUCTS.length) {
          setProducts(res.products);
        } else {
          setProducts(EXACT_WEB_PRODUCTS);
        }
      })
      .catch(() => {
        setProducts(EXACT_WEB_PRODUCTS);
      });
  }, []);

  const handleAddToCart = (product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId, qty) => {
    setCart((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity: qty } : i)));
  };

  const handleRemoveItem = (productId) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const handleCheckout = () => {
    setShowCart(false);
    if (cart.length > 0) {
      const p = cart[0];
      const targetUrl = p.affiliate_link || 'https://blinkit.com';
      Linking.openURL(targetUrl).catch(() => {});
      Alert.alert('Checkout Initiated', `Opening ${p.partner_name} to complete your order!`);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchCategory = !selectedCategory || (item.category || '').toLowerCase() === selectedCategory.toLowerCase();
    const matchSearch =
      !searchQuery ||
      (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.macro_tag || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const cartCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <StoreSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Nutri Store</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Delivered via Quick-Commerce Partners</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.cartBadgeBtn,
            { backgroundColor: isDark ? 'rgba(20,184,166,0.12)' : 'rgba(20,184,166,0.08)', borderColor: isDark ? 'rgba(20,184,166,0.35)' : 'rgba(20,184,166,0.25)' },
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => setShowCart(true)}
        >
          <ShoppingCart size={18} color={COLORS.teal} />
          <Text style={[styles.cartBtnText, { color: COLORS.teal }]}>Cart</Text>
          {cartCount > 0 && (
            <View style={styles.cartCountPill}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products, brands, or macros..."
          placeholderTextColor={colors.textMuted}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
            <X size={15} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={{ maxHeight: 44, marginBottom: SPACING.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <Pressable
                key={cat.label}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: active
                      ? (isDark ? 'rgba(20,184,166,0.22)' : 'rgba(20,184,166,0.12)')
                      : colors.bgCard,
                    borderColor: active ? COLORS.teal : colors.border,
                  },
                ]}
                onPress={() => {
                  triggerHaptic('selection');
                  setSelectedCategory(cat.slug);
                }}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: active ? COLORS.teal : colors.textSecondary, fontWeight: active ? '800' : '600' },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.productListContainer}>
        <View style={styles.grid}>
          {filteredProducts.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              colors={colors}
              isDark={isDark}
              onQuickView={(p) => setSelectedProduct(p)}
              onAddToCart={(p) => handleAddToCart(p)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Product Details Modal */}
      <ProductDetailModal
        visible={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        isDark={isDark}
        colors={colors}
      />

      {/* Cart Drawer Modal */}
      <CartDrawerModal
        visible={showCart}
        cart={cart}
        onClose={() => setShowCart(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        isDark={isDark}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, marginTop: 2 },
  cartBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  cartBtnText: { fontSize: 13, fontWeight: '800' },
  cartCountPill: {
    backgroundColor: COLORS.teal,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  cartCountText: { fontSize: 10, fontWeight: '900', color: '#fff' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, height: '100%' },

  categoryScroll: { paddingHorizontal: SPACING.base, gap: 8, alignItems: 'center' },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 12 },

  productListContainer: { paddingHorizontal: SPACING.base, paddingBottom: 100 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});

const prodStyles = StyleSheet.create({
  card: {
    width: '48.5%',
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  imageContainer: {
    width: '100%',
    height: 145,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  partnerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  partnerText: { fontSize: 9, fontWeight: '800' },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.md,
  },
  featuredText: { fontSize: 8, fontWeight: '900', color: '#fff' },

  body: { padding: 10, flex: 1, justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' },
  categoryText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  macroTagWrap: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  macroTagText: { fontSize: 8.5, fontWeight: '800', color: COLORS.teal },
  name: { fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 4 },
  etaText: { fontSize: 10, fontWeight: '600', marginBottom: 8 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  price: { fontSize: 16, fontWeight: '900' },
  origPrice: { fontSize: 11, color: '#94A3B8', textDecorationLine: 'line-through', marginTop: -2 },

  quickViewBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartBtn: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  dialog: { width: '100%', maxHeight: '85%', borderRadius: RADIUS['3xl'], borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  partnerTag: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: RADIUS.md, borderWidth: 1 },
  partnerTagText: { fontSize: 10, fontWeight: '800' },
  deliveryText: { fontSize: 11, fontWeight: '600' },
  closeBtn: { padding: 4, borderRadius: RADIUS.full },

  scrollBody: { paddingBottom: 16 },
  imageWrap: { width: '100%', height: 210 },
  image: { width: '100%', height: '100%' },

  title: { fontSize: 17, fontWeight: '900', lineHeight: 22, marginBottom: 8 },
  macroTagPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginBottom: 12,
  },
  macroTagPillText: { fontSize: 10, fontWeight: '800', color: COLORS.teal },

  nutritionRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  nutriPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.lg, borderWidth: 1 },
  nutriVal: { fontSize: 13, fontWeight: '900', marginTop: 3 },
  nutriLab: { fontSize: 8, fontWeight: '800', marginTop: 1 },

  desc: { fontSize: 12, lineHeight: 18 },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionPrice: { fontSize: 20, fontWeight: '900' },
  actionOrigPrice: { fontSize: 12, color: '#94A3B8', textDecorationLine: 'line-through', marginTop: -2 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  addCartModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
  },
  addCartModalText: { fontSize: 12, fontWeight: '800', color: COLORS.teal },
  buyNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.xl,
  },
  buyNowText: { fontSize: 12, fontWeight: '900', color: '#fff' },
});

const cartStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  drawer: { maxHeight: '80%', borderTopLeftRadius: RADIUS['3xl'], borderTopRightRadius: RADIUS['3xl'], borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  title: { fontSize: 17, fontWeight: '900' },

  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptySub: { fontSize: 12, textAlign: 'center', paddingHorizontal: 32 },

  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  itemImg: { width: 44, height: 44, borderRadius: RADIUS.lg },
  itemName: { fontSize: 13, fontWeight: '700' },
  itemPartner: { fontSize: 11, marginTop: 2 },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontSize: 13, fontWeight: '800', minWidth: 14, textAlign: 'center' },

  footer: { padding: 16, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: '900' },
  checkoutBtn: { backgroundColor: COLORS.teal, paddingVertical: 14, borderRadius: RADIUS.xl, alignItems: 'center' },
  checkoutBtnText: { fontSize: 14, fontWeight: '900', color: '#fff' },
});
