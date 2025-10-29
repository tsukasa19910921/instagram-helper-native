/**
 * カスタムピッカーコンポーネント
 * WEBアプリのselect要素のような選択UI
 *
 * 修正内容:
 * - アクセシビリティ強化（accessibilityViewIsModal、フォーカストラップ）
 * - フォーカス戻し機能を追加
 * - React.memoでパフォーマンス最適化
 */
import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  AccessibilityInfo,
  findNodeHandle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const CustomPicker = memo(({
  label,
  selectedValue,
  onValueChange,
  options = [],
  disabled = false,
  style = {}
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const triggerRef = useRef(null); // トリガー要素への参照

  // 選択された項目のラベルを取得
  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || '';

  /**
   * 項目選択時の処理
   */
  const handleSelect = (value) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onValueChange(value);
    closeModal();
  };

  /**
   * モーダルを開く
   */
  const openModal = () => {
    if (disabled) return;
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalVisible(true);
  };

  /**
   * モーダルを閉じる（フォーカスを戻す）
   */
  const closeModal = () => {
    setModalVisible(false);
    // モーダルを閉じたらフォーカスを戻す（アクセシビリティ）
    setTimeout(() => {
      const node = findNodeHandle(triggerRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }, 100);
  };

  return (
    <View style={[styles.container, style]}>
      {/* ラベル */}
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      {/* 選択ボタン */}
      <TouchableOpacity
        ref={triggerRef}
        style={[
          styles.selectButton,
          disabled && styles.selectButtonDisabled
        ]}
        onPress={openModal}
        disabled={disabled}
        activeOpacity={0.7}
        // アクセシビリティ対応
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedLabel}を選択`}
        accessibilityState={{ disabled }}
        accessibilityHint="タップして選択肢を表示"
      >
        <Text style={[
          styles.selectedText,
          disabled && styles.selectedTextDisabled
        ]}>
          {selectedLabel}
        </Text>
        <Ionicons
          name="chevron-down"
          size={20}
          color={disabled ? '#c7c7cc' : '#8e8e93'}
        />
      </TouchableOpacity>

      {/* 選択肢モーダル */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        // アクセシビリティ対応（重要）
        accessible
        accessibilityViewIsModal // iOS: モーダル外へのフォーカス移動を防ぐ
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
          accessible={false} // オーバーレイ自体はフォーカス不要
        >
          <View
            style={styles.modalContent}
            accessible
            accessibilityRole="menu"
            accessibilityLabel={`${label}の選択`}
            importantForAccessibility="yes" // Android: モーダルにフォーカスを限定
          >
            {/* ヘッダー */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {label}
              </Text>
              <TouchableOpacity
                onPress={closeModal}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible
                accessibilityRole="button"
                accessibilityLabel="閉じる"
              >
                <Ionicons name="close" size={24} color="#1c1c1e" />
              </TouchableOpacity>
            </View>

            {/* 選択肢リスト */}
            <ScrollView
              style={styles.optionsList}
              accessible={false} // 個々の項目がフォーカス可能なので、ScrollView自体は不要
            >
              {options.map((option, index) => {
                const isSelected = option.value === selectedValue;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      index === options.length - 1 && styles.optionItemLast,
                      isSelected && styles.optionItemSelected
                    ]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                    // アクセシビリティ対応
                    accessible
                    accessibilityRole="menuitem"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数（パフォーマンス最適化）
  return (
    prevProps.selectedValue === nextProps.selectedValue &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.options === nextProps.options
  );
});

CustomPicker.displayName = 'CustomPicker';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d1d6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44 // アクセシビリティ：最小タップ領域
  },
  selectButtonDisabled: {
    backgroundColor: '#f9f9f9',
    opacity: 0.6
  },
  selectedText: {
    fontSize: 16,
    color: '#1c1c1e',
    flex: 1
  },
  selectedTextDisabled: {
    color: '#8e8e93'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12
      },
      android: {
        elevation: 8
      }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e'
  },
  closeButton: {
    padding: 4
  },
  optionsList: {
    maxHeight: 400
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    minHeight: 44 // アクセシビリティ：最小タップ領域
  },
  optionItemLast: {
    borderBottomWidth: 0
  },
  optionItemSelected: {
    backgroundColor: '#f0f9ff'
  },
  optionText: {
    fontSize: 16,
    color: '#1c1c1e',
    flex: 1
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#007AFF'
  }
});
