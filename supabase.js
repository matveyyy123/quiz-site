// supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Твои данные из настроек Supabase
const supabaseUrl = 'https://dotzolfvbidfkrhwtdcp.supabase.co'
const supabaseKey = 'dtzozlfvbjdfkrhwtdcp' // вставь ключ из Project Settings → API

export const supabase = createClient(supabaseUrl, supabaseKey)

// Функции для работы со статистикой
export const statsAPI = {
    // Получить все статистики
    async getAll() {
        const { data, error } = await supabase
            .from('test_stats')
            .select('*')
        
        if (error) {
            console.log('Ошибка:', error)
            return {}
        }
        
        // Преобразуем в удобный формат
        const stats = {}
        data.forEach(item => {
            stats[item.test_id] = {
                count: item.count,
                rating: {
                    total: item.rating_total,
                    count: item.rating_count,
                    average: item.rating_avg
                }
            }
        })
        return stats
    },

    // Увеличить счетчик прохождений
    async addCount(testId) {
        const { data, error } = await supabase
            .from('test_stats')
            .select('count')
            .eq('test_id', testId)
            .single()
        
        if (error) {
            console.log('Ошибка:', error)
            return
        }
        
        const newCount = (data?.count || 0) + 1
        const { error: updateError } = await supabase
            .from('test_stats')
            .update({ count: newCount })
            .eq('test_id', testId)
        
        if (updateError) console.log('Ошибка:', updateError)
        return newCount
    },

    // Добавить оценку
    async addRating(testId, rating) {
        const { data, error } = await supabase
            .from('test_stats')
            .select('rating_total, rating_count, rating_avg')
            .eq('test_id', testId)
            .single()
        
        if (error) {
            console.log('Ошибка:', error)
            return
        }
        
        const newTotal = (data?.rating_total || 0) + rating
        const newCount = (data?.rating_count || 0) + 1
        const newAvg = newTotal / newCount
        
        const { error: updateError } = await supabase
            .from('test_stats')
            .update({
                rating_total: newTotal,
                rating_count: newCount,
                rating_avg: newAvg
            })
            .eq('test_id', testId)
        
        if (updateError) console.log('Ошибка:', updateError)
        return newAvg
    }
}