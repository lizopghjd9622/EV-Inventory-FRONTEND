import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useVoiceOrderStore } from '@/stores/voiceOrder'
import { OrderType, RecordStatus } from '@/constants'
import type { EditableOrderItem } from '@/types/models/order'

describe('useVoiceOrderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initSession', () => {
    it('initSession 后状态应重置为 Idle', () => {
      // Given
      const store = useVoiceOrderStore()

      // When
      store.initSession(OrderType.SALES)

      // Then
      expect(store.status).toBe(RecordStatus.Idle)
    })

    it('initSession 后 orderType 应正确赋值', () => {
      // Given
      const store = useVoiceOrderStore()

      // When
      store.initSession(OrderType.PURCHASE)

      // Then
      expect(store.orderType).toBe(OrderType.PURCHASE)
    })

    it('initSession 后 items 应清空', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      store.appendItem({ clientId: 'c1', name: '苹果', quantity: 2, unit: '箱' })

      // When
      store.initSession(OrderType.SALES)

      // Then
      expect(store.items).toHaveLength(0)
    })

    it('initSession 后 orderId 应为 null', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)

      // Then
      expect(store.orderId).toBeNull()
    })

    it('initSession 后 errorMessage 应为 null', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)

      // Then
      expect(store.errorMessage).toBeNull()
    })
  })

  describe('setAudioBlob', () => {
    it('setAudioBlob 后 audioBlob 应正确赋值', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })

      // When
      store.setAudioBlob(blob)

      // Then：Pinia reactive 包装后需用深度相等断言
      expect(store.audioBlob).toStrictEqual(blob)
    })
  })

  describe('appendItem', () => {
    it('appendItem 后 items 长度应增加', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      expect(store.items).toHaveLength(0)

      // When
      store.appendItem({ clientId: 'c1', name: '香蕉', quantity: 5, unit: '把' })

      // Then
      expect(store.items).toHaveLength(1)
    })

    it('appendItem 后条目内容应正确', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const item: EditableOrderItem = { clientId: 'c2', name: '橙子', quantity: 3, unit: '个' }

      // When
      store.appendItem(item)

      // Then
      expect(store.items[0]).toEqual(item)
    })
  })

  describe('updateItem', () => {
    it('updateItem 后对应条目内容应更新', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      store.appendItem({ clientId: 'c3', name: '葡萄', quantity: 2, unit: '串' })

      // When
      store.updateItem({ clientId: 'c3', name: '葡萄干', quantity: 10, unit: '袋' })

      // Then
      expect(store.items[0].name).toBe('葡萄干')
      expect(store.items[0].quantity).toBe(10)
      expect(store.items[0].unit).toBe('袋')
    })

    it('updateItem 不存在的 clientId 不应影响其他条目', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      store.appendItem({ clientId: 'c4', name: '苹果', quantity: 1, unit: '个' })

      // When
      store.updateItem({ clientId: 'c999', name: '不存在', quantity: 0, unit: '' })

      // Then
      expect(store.items[0].name).toBe('苹果')
    })
  })

  describe('deleteItem', () => {
    it('deleteItem 后对应条目应从 items 中移除', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      store.appendItem({ clientId: 'c5', name: '西瓜', quantity: 1, unit: '个' })
      store.appendItem({ clientId: 'c6', name: '哈密瓜', quantity: 2, unit: '个' })
      expect(store.items).toHaveLength(2)

      // When
      store.deleteItem('c5')

      // Then
      expect(store.items).toHaveLength(1)
      expect(store.items[0].clientId).toBe('c6')
    })
  })

  describe('setError', () => {
    it('setError 后 status 应为 Error', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)

      // When
      store.setError('识别失败，请重试')

      // Then
      expect(store.status).toBe(RecordStatus.Error)
    })

    it('setError 后 errorMessage 应正确赋值', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)

      // When
      store.setError('网络超时')

      // Then
      expect(store.errorMessage).toBe('网络超时')
    })

    it('setError 后 audioBlob 应保留不被清除', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)
      const blob = new Blob(['audio'], { type: 'audio/wav' })
      store.setAudioBlob(blob)

      // When
      store.setError('识别失败')

      // Then：audioBlob 保留，允许重发（Pinia reactive 包装，用深度相等断言）
      expect(store.audioBlob).toStrictEqual(blob)
    })
  })

  describe('setOrderId', () => {
    it('setOrderId 后 orderId 应更新，status 变为 Done', () => {
      // Given
      const store = useVoiceOrderStore()
      store.initSession(OrderType.SALES)

      // When
      store.setOrderId(42)

      // Then
      expect(store.orderId).toBe(42)
      expect(store.status).toBe(RecordStatus.Done)
    })
  })
})
