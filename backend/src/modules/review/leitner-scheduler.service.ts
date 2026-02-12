import { Injectable } from '@nestjs/common';
import {
  LEITNER_BOXES,
  ReviewResult,
  ReviewDifficulty,
} from './dto/review.dto';

/**
 * Leitner 箱子调度器
 * 实现 Leitner 间隔重复算法
 *
 * 算法原理：
 * 1. 有 5 个箱子，每个箱子对应不同的复习间隔
 * 2. 答对 -> 移动到下一个箱子（复习间隔延长）
 * 3. 答错 -> 返回到第一个箱子（重新开始学习）
 * 4. 可根据用户反馈（难度）调整
 */
@Injectable()
export class LeitnerScheduler {
  /**
   * 计算下一个复习状态
   */
  calculateNextReview(
    currentBox: number,
    result: ReviewResult,
    difficulty?: ReviewDifficulty,
    currentEaseFactor: number = 2.5,
  ): {
    newBox: number;
    intervalDays: number;
    easeFactor: number;
    nextReviewAt: Date;
  } {
    let newBox = currentBox;
    let easeFactor = currentEaseFactor;

    // 根据结果和难度计算新的箱子位置
    switch (result) {
      case ReviewResult.CORRECT:
        // 正确：根据难度决定是否升级
        if (difficulty === ReviewDifficulty.EASY) {
          newBox = Math.min(currentBox + 2, LEITNER_BOXES.length);
          easeFactor += 0.15;
        } else if (difficulty === ReviewDifficulty.MEDIUM) {
          newBox = Math.min(currentBox + 1, LEITNER_BOXES.length);
          easeFactor += 0.1;
        } else {
          // HARD - 保持当前箱子
          easeFactor -= 0.05;
        }
        break;

      case ReviewResult.PARTIALLY:
        // 部分正确：降一级箱子
        newBox = Math.max(currentBox - 1, 1);
        easeFactor -= 0.1;
        break;

      case ReviewResult.INCORRECT:
      case ReviewResult.FORGOTTEN:
        // 错误：回到第一个箱子
        newBox = 1;
        easeFactor = Math.max(2.0, easeFactor - 0.3);
        break;
    }

    // 限制 easeFactor 范围
    easeFactor = Math.max(1.3, Math.min(3.0, easeFactor));

    // 获取新箱子的间隔天数
    const boxConfig = LEITNER_BOXES.find((b) => b.box === newBox);
    let intervalDays = boxConfig ? boxConfig.intervalDays : 1;

    // 使用 easeFactor 调整间隔
    // 简单的 SM-2 变体算法
    if (newBox === currentBox && result === ReviewResult.CORRECT) {
      // 如果保持在同一箱子但答对了，稍微增加间隔
      intervalDays = Math.floor(intervalDays * easeFactor);
    }

    // 计算下次复习时间
    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

    return {
      newBox,
      intervalDays,
      easeFactor: parseFloat(easeFactor.toFixed(2)),
      nextReviewAt,
    };
  }

  /**
   * 计算初始复习时间
   */
  calculateInitialReview(initialStage: number = 1): {
    box: number;
    intervalDays: number;
    nextReviewAt: Date;
  } {
    const box = Math.min(Math.max(initialStage, 1), LEITNER_BOXES.length);
    const boxConfig = LEITNER_BOXES.find((b) => b.box === box);
    const intervalDays = boxConfig ? boxConfig.intervalDays : 1;

    const nextReviewAt = new Date();
    // 新加入的错题，第一次复习设为今天
    if (intervalDays === 1) {
      nextReviewAt.setHours(nextReviewAt.getHours() + 1); // 1小时后复习
    } else {
      nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);
    }

    return {
      box,
      intervalDays,
      nextReviewAt,
    };
  }

  /**
   * 获取箱子信息
   */
  getBoxInfo(box: number) {
    return LEITNER_BOXES.find((b) => b.box === box);
  }

  /**
   * 获取所有箱子配置
   */
  getAllBoxes() {
    return LEITNER_BOXES;
  }

  /**
   * 计算复习优先级
   * 值越小优先级越高
   */
  calculatePriority(review: {
    stage: number;
    nextReviewAt: Date;
    reviewCount: number;
  }): number {
    const now = new Date();
    const overdueMs = now.getTime() - review.nextReviewAt.getTime();
    const overdueHours = overdueMs / (1000 * 60 * 60);

    // 越期越久 + 箱子越小 = 优先级越高
    // 基础优先级基于箱子编号（箱子越小优先级越高）
    const basePriority = (LEITNER_BOXES.length - review.stage + 1) * 100;

    // 越期加分（每小时加1分）
    const overdueBonus = Math.max(0, overdueHours);

    // 复习次数少的加分
    const countBonus = Math.max(0, 10 - review.reviewCount);

    return basePriority + overdueBonus + countBonus;
  }

  /**
   * 判断是否需要复习
   */
  isDue(nextReviewAt: Date): boolean {
    const now = new Date();
    return nextReviewAt <= now;
  }

  /**
   * 计算复习进度百分比
   */
  calculateProgress(dueCount: number, totalCount: number): number {
    if (totalCount === 0) return 100;
    return Math.round(((totalCount - dueCount) / totalCount) * 100);
  }

  /**
   * 获取今日应该复习的箱子
   */
  getDueBoxesForToday(): number[] {
    // 返回间隔为 1 天的箱子
    return LEITNER_BOXES.filter((b) => b.intervalDays === 1).map((b) => b.box);
  }

  /**
   * 获取本周应该复习的箱子
   */
  getDueBoxesForWeek(): number[] {
    // 返回间隔 ≤ 7 天的箱子
    return LEITNER_BOXES.filter((b) => b.intervalDays <= 7).map((b) => b.box);
  }

  /**
   * 预测未来复习负荷
   */
  predictFutureLoad(
    currentReviews: Array<{
      nextReviewAt: Date;
      stage: number;
    }>,
    days: number = 7,
  ): Array<{ date: Date; count: number }> {
    const prediction: Array<{ date: Date; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      targetDate.setHours(0, 0, 0, 0);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // 统计该日期到期的复习数量
      const count = currentReviews.filter((r) => {
        return r.nextReviewAt >= targetDate && r.nextReviewAt < nextDay;
      }).length;

      prediction.push({
        date: targetDate,
        count,
      });
    }

    return prediction;
  }

  /**
   * 优化复习计划
   * 如果某天复习量过大，建议提前复习部分内容
   */
  optimizeSchedule(
    prediction: Array<{ date: Date; count: number }>,
    maxDaily: number = 50,
  ): {
    hasOverload: boolean;
    recommendations: string[];
    suggestedMoves: Array<{
      from: Date;
      to: Date;
      count: number;
    }>;
  } {
    const recommendations: string[] = [];
    const suggestedMoves: Array<{
      from: Date;
      to: Date;
      count: number;
    }> = [];

    let hasOverload = false;

    for (let i = 0; i < prediction.length; i++) {
      const day = prediction[i];

      if (day.count > maxDaily) {
        hasOverload = true;
        const excess = day.count - maxDaily;

        recommendations.push(
          `${day.date.toLocaleDateString()} 复习量过大 (${day.count}题)`,
        );
        recommendations.push(
          `建议提前复习 ${excess} 道题，分散学习压力`,
        );

        // 查找之前复习量较少的日期
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevDay = prediction[j];
          if (prevDay.count < maxDaily * 0.5) {
            const moveCount = Math.min(
              excess,
              Math.floor((maxDaily - prevDay.count) / 2),
            );
            suggestedMoves.push({
              from: day.date,
              to: prevDay.date,
              count: moveCount,
            });
          }
        }
      }
    }

    return {
      hasOverload,
      recommendations,
      suggestedMoves,
    };
  }
}
