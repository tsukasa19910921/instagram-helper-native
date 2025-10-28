// 履歴画面 - 過去に生成した投稿の閲覧
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

import { getHistory, deleteHistoryItem, clearHistory } from '../services/storage';

const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // 画面がフォーカスされたときに履歴を読み込む
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  /**
   * 履歴を読み込む
   */
  const loadHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (error) {
      console.error('履歴の読み込みエラー:', error);
      Alert.alert('エラー', '履歴の読み込みに失敗しました');
    }
  };

  /**
   * リフレッシュ処理
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  /**
   * 履歴アイテムをタップ
   */
  const handleItemPress = (item) => {
    setSelectedItem(item.id === selectedItem ? null : item.id);
  };

  /**
   * キャプションをコピー
   */
  const copyCaption = async (caption) => {
    try {
      await Clipboard.setStringAsync(caption);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('コピー完了', '文章をクリップボードにコピーしました');
    } catch (error) {
      console.error('コピーエラー:', error);
      Alert.alert('エラー', 'コピーに失敗しました');
    }
  };

  /**
   * 画像をシェア
   */
  const shareImage = async (imageUri) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Instagram投稿をシェア'
        });
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert('エラー', 'シェア機能が利用できません');
      }
    } catch (error) {
      console.error('シェアエラー:', error);
      Alert.alert('エラー', 'シェアに失敗しました');
    }
  };

  /**
   * 履歴アイテムを削除
   */
  const deleteItem = async (id) => {
    Alert.alert(
      '削除確認',
      'この履歴を削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHistoryItem(id);
              await loadHistory();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('削除エラー:', error);
              Alert.alert('エラー', '削除に失敗しました');
            }
          }
        }
      ]
    );
  };

  /**
   * すべての履歴をクリア
   */
  const clearAllHistory = () => {
    Alert.alert(
      'すべて削除',
      'すべての履歴を削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'すべて削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              await loadHistory();
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('クリアエラー:', error);
              Alert.alert('エラー', 'クリアに失敗しました');
            }
          }
        }
      ]
    );
  };

  /**
   * 日時をフォーマット
   */
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy/MM/dd HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  /**
   * 履歴アイテムのレンダリング
   */
  const renderItem = ({ item }) => {
    const isExpanded = selectedItem === item.id;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemHeader}>
          <Image source={{ uri: item.processedImage }} style={styles.thumbnail} />
          <View style={styles.itemInfo}>
            <Text style={styles.caption} numberOfLines={isExpanded ? undefined : 2}>
              {item.caption}
            </Text>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {/* 展開時のアクションボタン */}
        {isExpanded && (
          <View style={styles.itemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => copyCaption(item.caption)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>コピー</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => shareImage(item.processedImage)}
              activeOpacity={0.7}
            >
              <Text style={styles.actionButtonText}>シェア</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deleteItem(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>削除</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * 空のリスト表示
   */
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyText}>まだ履歴がありません</Text>
      <Text style={styles.emptySubtext}>ホーム画面で投稿を生成してみましょう</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ヘッダーのクリアボタン */}
      {history.length > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>すべて削除</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 履歴リスト */}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContainer,
          history.length === 0 && styles.listContainerEmpty
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7'
  },
  headerActions: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    alignItems: 'flex-end'
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ff3b30',
    borderRadius: 8
  },
  clearButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  listContainer: {
    padding: 12
  },
  listContainerEmpty: {
    flex: 1
  },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  itemHeader: {
    flexDirection: 'row'
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f9f9f9'
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center'
  },
  caption: {
    fontSize: 14,
    color: '#1c1c1e',
    marginBottom: 6,
    lineHeight: 20
  },
  date: {
    fontSize: 12,
    color: '#8e8e93'
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5ea'
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  deleteButton: {
    backgroundColor: '#ff3b30'
  },
  deleteButtonText: {
    color: '#fff'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center'
  }
});

export default HistoryScreen;
