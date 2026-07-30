/**
 * Statistical calculation utilities for score comparison analytics
 * Provides functions for calculating Cohen's Kappa, F1 Score, Overall Agreement,
 * and interpretation functions for various statistical metrics.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ConfusionMatrixRow {
  rowCategory: string;
  colCategory: string;
  count: number;
}

export interface InterpretationResult {
  strength: string;
  color: string;
  description: string;
}

// ============================================================================
// Categorical Statistics Calculations
// ============================================================================

/**
 * Calculate Cohen's Kappa for inter-rater agreement
 * Cohen's Kappa measures agreement between two raters while accounting for
 * chance agreement. Range: [-1, 1] where 1 = perfect agreement.
 *
 * Formula: κ = (Po - Pe) / (1 - Pe)
 * Where Po = observed agreement, Pe = expected agreement by chance
 *
 * @param confusionMatrix - Array of confusion matrix cells
 * @returns Cohen's Kappa coefficient or null if calculation not possible
 */
export function calculateCohensKappa(
  confusionMatrix: ConfusionMatrixRow[],
): number | null {
  if (!confusionMatrix || confusionMatrix.length === 0) {
    return null;
  }

  // Calculate total count
  const total = confusionMatrix.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return null;
  }

  // Build set of all categories
  const categories = Array.from(
    new Set([
      ...confusionMatrix.map((r) => r.rowCategory),
      ...confusionMatrix.map((r) => r.colCategory),
    ]),
  ).sort();

  // Calculate observed agreement (Po)
  const observedAgreement =
    confusionMatrix
      .filter((r) => r.rowCategory === r.colCategory)
      .reduce((sum, r) => sum + r.count, 0) / total;

  // Calculate marginal totals for expected agreement
  const score1Totals: Record<string, number> = {};
  const score2Totals: Record<string, number> = {};

  confusionMatrix.forEach((r) => {
    score1Totals[r.rowCategory] = (score1Totals[r.rowCategory] || 0) + r.count;
    score2Totals[r.colCategory] = (score2Totals[r.colCategory] || 0) + r.count;
  });

  // Calculate expected agreement (Pe)
  const expectedAgreement = categories.reduce((sum, cat) => {
    const p1 = (score1Totals[cat] || 0) / total;
    const p2 = (score2Totals[cat] || 0) / total;
    return sum + p1 * p2;
  }, 0);

  // Calculate Kappa
  const denominator = 1 - expectedAgreement;
  if (Math.abs(denominator) < 1e-10) {
    // Perfect expected agreement - return 1 if observed is also perfect
    return observedAgreement === 1 ? 1 : null;
  }

  const kappa = (observedAgreement - expectedAgreement) / denominator;

  // Round to 3 decimal places
  return Math.round(kappa * 1000) / 1000;
}

/**
 * Calculate weighted F1 score for multi-class classification
 * F1 is the harmonic mean of precision and recall, weighted by support.
 * Range: [0, 1] where 1 = perfect classification.
 *
 * @param confusionMatrix - Array of confusion matrix cells
 * @returns Weighted F1 score or null if calculation not possible
 */
export function calculateWeightedF1Score(
  confusionMatrix: ConfusionMatrixRow[],
): number | null {
  if (!confusionMatrix || confusionMatrix.length === 0) {
    return null;
  }

  const total = confusionMatrix.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return null;
  }

  // Get all unique categories
  const categories = Array.from(
    new Set(confusionMatrix.flatMap((r) => [r.rowCategory, r.colCategory])),
  ).sort();

  // Calculate F1 score for each category
  const f1Scores = categories.map((cat) => {
    // True Positives: both scores match this category
    const tp =
      confusionMatrix.find(
        (r) => r.rowCategory === cat && r.colCategory === cat,
      )?.count || 0;

    // False Positives: score2 is this category but score1 is not
    const fp = confusionMatrix
      .filter((r) => r.colCategory === cat && r.rowCategory !== cat)
      .reduce((sum, r) => sum + r.count, 0);

    // False Negatives: score1 is this category but score2 is not
    const fn = confusionMatrix
      .filter((r) => r.rowCategory === cat && r.colCategory !== cat)
      .reduce((sum, r) => sum + r.count, 0);

    // Calculate precision and recall
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

    // Calculate F1 score
    const f1 =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;

    // Support is the number of actual instances of this category
    const support = tp + fn;

    return { f1, support };
  });

  // Calculate weighted average F1 score
  const weightedF1 =
    f1Scores.reduce((sum, { f1, support }) => sum + f1 * support, 0) / total;

  // Round to 3 decimal places
  return Math.round(weightedF1 * 1000) / 1000;
}

/**
 * Calculate overall agreement (simple accuracy)
 * This is the percentage of cases where both scores agree.
 * Range: [0, 1] where 1 = 100% agreement.
 *
 * @param confusionMatrix - Array of confusion matrix cells
 * @returns Overall agreement percentage or null if calculation not possible
 */
export function calculateOverallAgreement(
  confusionMatrix: ConfusionMatrixRow[],
): number | null {
  if (!confusionMatrix || confusionMatrix.length === 0) {
    return null;
  }

  const total = confusionMatrix.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return null;
  }

  // Sum diagonal (matching categories)
  const matching = confusionMatrix
    .filter((r) => r.rowCategory === r.colCategory)
    .reduce((sum, r) => sum + r.count, 0);

  const agreement = matching / total;

  // Round to 3 decimal places
  return Math.round(agreement * 1000) / 1000;
}

// ============================================================================
// Interpretation Functions
// ============================================================================

/**
 * Interpret Pearson correlation coefficient
 * Reference: Cohen, J. (1988). Statistical power analysis for the behavioral sciences.
 *
 * @param r - Pearson correlation coefficient
 * @returns Interpretation with strength, color, and description
 */
export function interpretPearsonCorrelation(
  r: number | null,
): InterpretationResult {
  if (r === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  const abs = Math.abs(r);
  const direction = r > 0 ? "positive" : r < 0 ? "negative" : "no";

  if (abs >= 0.9) {
    return {
      strength: "非常强",
      color: "green",
      description: `非常强的${direction === "positive" ? "正" : "负"}线性相关`,
    };
  }
  if (abs >= 0.7) {
    return {
      strength: "强",
      color: "blue",
      description: `强的${direction === "positive" ? "正" : "负"}线性相关`,
    };
  }
  if (abs >= 0.5) {
    return {
      strength: "中等",
      color: "yellow",
      description: `中等${direction === "positive" ? "正" : "负"}线性相关`,
    };
  }
  if (abs >= 0.3) {
    return {
      strength: "弱",
      color: "orange",
      description: `弱的${direction === "positive" ? "正" : "负"}线性相关`,
    };
  }
  return {
    strength: "非常弱",
    color: "red",
    description: `非常弱或无线性相关`,
  };
}

/**
 * Interpret Spearman rank correlation coefficient
 * Similar interpretation to Pearson but for monotonic relationships
 *
 * @param rho - Spearman's rho coefficient
 * @returns Interpretation with strength, color, and description
 */
export function interpretSpearmanCorrelation(
  rho: number | null,
): InterpretationResult {
  if (rho === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  const abs = Math.abs(rho);
  const direction = rho > 0 ? "positive" : rho < 0 ? "negative" : "no";

  if (abs >= 0.9) {
    return {
      strength: "非常强",
      color: "green",
      description: `非常强的${direction === "positive" ? "正" : "负"}单调关系`,
    };
  }
  if (abs >= 0.7) {
    return {
      strength: "强",
      color: "blue",
      description: `强的${direction === "positive" ? "正" : "负"}单调关系`,
    };
  }
  if (abs >= 0.5) {
    return {
      strength: "中等",
      color: "yellow",
      description: `中等${direction === "positive" ? "正" : "负"}单调关系`,
    };
  }
  if (abs >= 0.3) {
    return {
      strength: "弱",
      color: "orange",
      description: `弱的${direction === "positive" ? "正" : "负"}单调关系`,
    };
  }
  return {
    strength: "非常弱",
    color: "red",
    description: `非常弱或无单调关系`,
  };
}

/**
 * Interpret Cohen's Kappa coefficient
 * Reference: Landis, J. R., & Koch, G. G. (1977). The measurement of observer
 * agreement for categorical data. Biometrics, 159-174.
 *
 * @param kappa - Cohen's Kappa coefficient
 * @returns Interpretation with strength, color, and description
 */
export function interpretCohensKappa(
  kappa: number | null,
): InterpretationResult {
  if (kappa === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  if (kappa >= 1.0) {
    return {
      strength: "完美",
      color: "green",
      description: "评分间完全一致",
    };
  }
  if (kappa >= 0.81) {
    return {
      strength: "几乎完美",
      color: "green",
      description: "评分间几乎完美一致",
    };
  }
  if (kappa >= 0.61) {
    return {
      strength: "显著",
      color: "blue",
      description: "评分间显著一致",
    };
  }
  if (kappa >= 0.41) {
    return {
      strength: "中等",
      color: "yellow",
      description: "评分间中等一致",
    };
  }
  if (kappa >= 0.21) {
    return {
      strength: "一般",
      color: "orange",
      description: "评分间一般一致",
    };
  }
  if (kappa > 0) {
    return {
      strength: "轻微",
      color: "red",
      description: "评分间轻微一致",
    };
  }
  return {
    strength: "差",
    color: "red",
    description: "一致性差（低于随机水平）",
  };
}

/**
 * Interpret F1 score
 * Common thresholds for classification performance
 *
 * @param f1 - F1 score
 * @returns Interpretation with strength, color, and description
 */
export function interpretF1Score(f1: number | null): InterpretationResult {
  if (f1 === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  if (f1 >= 0.9) {
    return {
      strength: "优秀",
      color: "green",
      description: "分类性能优秀",
    };
  }
  if (f1 >= 0.8) {
    return {
      strength: "良好",
      color: "blue",
      description: "分类性能良好",
    };
  }
  if (f1 >= 0.6) {
    return {
      strength: "一般",
      color: "yellow",
      description: "分类性能一般",
    };
  }
  if (f1 >= 0.4) {
    return {
      strength: "差",
      color: "orange",
      description: "分类性能差",
    };
  }
  return {
    strength: "非常差",
    color: "red",
    description: "分类性能非常差",
  };
}

/**
 * Interpret overall agreement percentage
 *
 * @param agreement - Overall agreement (0-1)
 * @returns Interpretation with strength, color, and description
 */
export function interpretOverallAgreement(
  agreement: number | null,
): InterpretationResult {
  if (agreement === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  const percentage = Math.round(agreement * 100);

  if (agreement >= 0.9) {
    return {
      strength: "优秀",
      color: "green",
      description: `${percentage}% 的预测结果匹配`,
    };
  }
  if (agreement >= 0.8) {
    return {
      strength: "良好",
      color: "blue",
      description: `${percentage}% 的预测结果匹配`,
    };
  }
  if (agreement >= 0.6) {
    return {
      strength: "一般",
      color: "yellow",
      description: `${percentage}% 的预测结果匹配`,
    };
  }
  if (agreement >= 0.4) {
    return {
      strength: "差",
      color: "orange",
      description: `${percentage}% 的预测结果匹配`,
    };
  }
  return {
    strength: "非常差",
    color: "red",
    description: `${percentage}% 的预测结果匹配`,
  };
}

/**
 * Interpret Mean Absolute Error (MAE)
 * Context-dependent interpretation based on scale
 *
 * @param mae - Mean Absolute Error
 * @param scale - Optional scale information {min, max} for contextual interpretation
 * @returns Interpretation with strength, color, and description
 */
export function interpretMAE(
  mae: number | null,
  scale?: { min: number; max: number },
): InterpretationResult {
  if (mae === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  if (scale) {
    const range = scale.max - scale.min;
    const relativeError = mae / range;

    if (relativeError <= 0.05) {
      return {
        strength: "优秀",
        color: "green",
        description: `误差非常低 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    if (relativeError <= 0.1) {
      return {
        strength: "良好",
        color: "blue",
        description: `误差低 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    if (relativeError <= 0.2) {
      return {
        strength: "一般",
        color: "yellow",
        description: `误差中等 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    if (relativeError <= 0.3) {
      return {
        strength: "差",
        color: "orange",
        description: `误差偏高 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    return {
      strength: "非常差",
      color: "red",
      description: `误差非常高 (${(relativeError * 100).toFixed(1)}% 范围)`,
    };
  }

  // Without scale context, just report the value
  return {
    strength: "N/A",
    color: "gray",
    description: `平均误差: ${mae.toFixed(3)}`,
  };
}

/**
 * Interpret Root Mean Squared Error (RMSE)
 * Context-dependent interpretation based on scale
 * RMSE penalizes large errors more than MAE
 *
 * @param rmse - Root Mean Squared Error
 * @param scale - Optional scale information {min, max} for contextual interpretation
 * @returns Interpretation with strength, color, and description
 */
export function interpretRMSE(
  rmse: number | null,
  scale?: { min: number; max: number },
): InterpretationResult {
  if (rmse === null) {
    return {
      strength: "N/A",
      color: "gray",
      description: "无可用数据",
    };
  }

  if (scale) {
    const range = scale.max - scale.min;
    const relativeError = rmse / range;

    if (relativeError <= 0.05) {
      return {
        strength: "优秀",
        color: "green",
        description: `误差非常低 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    if (relativeError <= 0.1) {
      return {
        strength: "良好",
        color: "blue",
        description: `误差低 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    if (relativeError <= 0.2) {
      return {
        strength: "一般",
        color: "yellow",
        description: `误差中等 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    if (relativeError <= 0.3) {
      return {
        strength: "差",
        color: "orange",
        description: `误差偏高 (${(relativeError * 100).toFixed(1)}% 范围)`,
      };
    }
    return {
      strength: "非常差",
      color: "red",
      description: `误差非常高 (${(relativeError * 100).toFixed(1)}% 范围)`,
    };
  }

  // Without scale context, just report the value
  return {
    strength: "N/A",
    color: "gray",
    description: `均方根误差: ${rmse.toFixed(3)}`,
  };
}
