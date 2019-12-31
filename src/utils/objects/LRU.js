// LRU (Least Recently Used) 表示最近最少使用
// LRU 内部维护的是一个 LInkedHashMap, LinkedHashMap 保持了元素的插入顺序, 使得遍历顺序可按插入顺序输出
/**
 * LRU Cache
 * @constructor
 * @alias LRU
 */
class LRU {
  constructor(maxSize) {
    this._list = new LinkedList()

    this._map = {}

    this._maxSize = maxSize || 10

    this._lastRemovedEntry = null
  }
  /**
   * @param  {string} key
   * @param  {} value
   * @return {} Removed value
   */
  put (key, value) {
    const list = this._list
    const map = this._map
    let removed = null
    if (!map[key]) {
      let len = list.len()
      // Reuse last removed entry
      let entry = this._lastRemovedEntry

      if (len >= this._maxSize && len > 0) {
        // Remove the least recently used
        let leastUsedEntry = list.head
        list.remove(leastUsedEntry)
        delete map[leastUsedEntry.key]

        removed = leastUsedEntry.value
        this._lastRemovedEntry = leastUsedEntry
      }

      if (entry) {
        entry.value = value
      } else {
        entry = new Entry(value)
      }
      entry.key = key
      list.insertEntry(entry)
      map[key] = entry
    }

    return removed
  }
  /**
   * @param  {string} key
   * @return {}
   */
  get (key) {
    const entry = this._map[key]
    const list = this._list
    if (entry) {
      // Put the latest used entry in the tail
      if (entry !== list.tail) {
        list.remove(entry)
        list.insertEntry(entry)
      }

      return entry.value
    }
  }
  /**
   * Clear the cache
   */
  clear () {
    this._list.clear()
    this._map = {}
  }
}
/**
 * @constructor
 * @param {} val
 */
class Entry {
  constructor(val) {
    this.value = val
    this.next = null
    this.prev = null
  }
}
/**
 * Simple double linked list. Compared with array, it has O(1) remove operation.
 * @constructor
 */
class LinkedList {
  constructor() {
    this.head = null
    this.tail = null
    this.length = 0
  }
  /**
   * Insert a new value at the tail
   * @param  {} val
   * @return {LRU~Entry}
   */
  insert (val) {
    const entry = new Entry(val)
    this.insertEntry(entry)
    return entry
  }
  /**
   * Insert an entry at the tail
   * @param  {LRU~Entry} entry
   */
  insertEntry (entry) {
    if (!this.head) {
      this.head = this.tail = entry
    } else {
      this.tail.next = entry
      entry.prev = this.tail
      entry.next = null
      this.tail = entry
    }
    this.length++
  }
  /**
   * Remove entry.
   * @param  {LRU~Entry} entry
   */
  remove (entry) {
    const prev = entry.prev
    const next = entry.next
    if (prev) {
      prev.next = next
    }
    else {
      // Is head
      this.head = next
    }
    if (next) {
      next.prev = prev
    }
    else {
      // Is tail
      this.tail = prev
    }
    entry.next = null
    entry.prev = null
    this.length--
  }
  /**
   * @return {number}
   */
  len () {
    return this.length
  }
  /**
   * Clear list
   */
  clear () {
    this.head = null
    this.tail = null
    this.length = 0
  }
}

export default LRU