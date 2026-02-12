import { Injectable } from '@nestjs/common';
import { ParsedMistake } from './dto/mistake.dto';

@Injectable()
export class QuestionParserService {
  /**
   * 智能解析题目内容
   */
  async parse(content: string): Promise<ParsedMistake> {
    const trimmedContent = content.trim();

    const result: ParsedMistake = {
      type: 'choice',
      content: trimmedContent,
      question: '',
      options: [],
      answer: '',
      analysis: '',
      knowledgePoints: [],
      difficultyLevel: 'medium',
    };

    // 检测题型
    result.type = this.detectQuestionType(trimmedContent);

    // 分离题目和选项
    const { question, options } = this.separateQuestionAndOptions(trimmedContent);
    result.question = question;
    result.options = options;

    // 提取答案
    result.answer = this.extractAnswer(trimmedContent, result.type, options);

    // 提取解析
    result.analysis = this.extractAnalysis(trimmedContent);

    // 检测难度
    result.difficultyLevel = this.detectDifficulty(trimmedContent);

    // 提取知识点
    result.knowledgePoints = this.extractKnowledgePoints(trimmedContent);

    return result;
  }

  /**
   * 检测题目类型
   */
  private detectQuestionType(content: string): string {
    // 多选题
    if (content.includes('多选') || content.includes('多项选择')) {
      return 'choice-multi';
    }

    // 判断题
    if (
      content.includes('判断') ||
      content.includes('对错') ||
      content.includes('√') ||
      content.includes('×')
    ) {
      return 'judge';
    }

    // 填空题
    if (
      content.includes('填空') ||
      content.includes('____') ||
      content.includes('（）') ||
      content.includes('(  )')
    ) {
      return 'fill';
    }

    // 解答题
    if (
      content.includes('解答') ||
      content.includes('简答') ||
      content.includes('论述') ||
      content.includes('计算')
    ) {
      return 'essay';
    }

    // 默认为单选题
    return 'choice';
  }

  /**
   * 分离题目内容和选项
   */
  private separateQuestionAndOptions(content: string): {
    question: string;
    options: string[];
  } {
    const lines = content.split('\n');
    const questionLines: string[] = [];
    const optionLines: string[] = [];
    let inOptions = false;
    let hasOptions = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 检测选项开始（A. 或 A、 或 （A））
      if (/^[A-Z][.、]|[（(][A-Z][）)]/.test(line)) {
        inOptions = true;
        hasOptions = true;
      }

      // 检测答案或解析开始
      if (
        line.match(/^(答案|解析|分析|考点|知识点)[：:]/) ||
        line.match(/^答[：:]/)
      ) {
        break;
      }

      if (inOptions && hasOptions) {
        optionLines.push(line);
      } else {
        questionLines.push(line);
      }
    }

    return {
      question: questionLines.join('\n').trim(),
      options: optionLines,
    };
  }

  /**
   * 提取答案
   */
  private extractAnswer(content: string, type: string, options: string[]): string {
    const patterns = [
      /答案[：:]\s*([A-D]+|对|错|√|×|✔|✘)/i,
      /正确答案[：:]\s*([A-D]+|对|错|√|×)/i,
      /答[：:]\s*([A-D]+|对|错|√|×)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        let answer = match[1];
        // 标准化答案
        if (answer === '√' || answer === '✔') answer = '对';
        if (answer === '×' || answer === '✘') answer = '错';
        return answer;
      }
    }

    // 从选项中推断正确答案（查找带勾的选项）
    for (const option of options) {
      if (option.includes('✓') || option.includes('√') || option.includes('✔')) {
        const labelMatch = option.match(/^[A-Z][.、]/);
        if (labelMatch) {
          return labelMatch[0].replace(/[.、]/, '');
        }
      }
    }

    return '';
  }

  /**
   * 提取解析
   */
  private extractAnalysis(content: string): string {
    const patterns = [
      /解析[：:]\s*([\s\S]*?)(?=(?:考点|知识点|$))/i,
      /分析[：:]\s*([\s\S]*?)(?=(?:考点|知识点|$))/i,
      /题目解析[：:]\s*([\s\S]*?)(?=(?:考点|知识点|$))/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return '';
  }

  /**
   * 检测难度
   */
  private detectDifficulty(content: string): 'easy' | 'medium' | 'hard' {
    if (content.includes('困难') || content.includes('hard') || content.includes('难')) {
      return 'hard';
    }

    if (
      content.includes('简单') ||
      content.includes('容易') ||
      content.includes('easy') ||
      content.includes('基础')
    ) {
      return 'easy';
    }

    return 'medium';
  }

  /**
   * 提取知识点
   */
  private extractKnowledgePoints(content: string): string[] {
    const points: string[] = [];

    const patterns = [
      /考点[：:]\s*([^\n]+)/i,
      /知识点[：:]\s*([^\n]+)/i,
      /考查[：:]\s*([^\n]+)/i,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const extractedPoints = match[1]
          .split(/[,，、]/)
          .map(p => p.trim())
          .filter(p => p);
        points.push(...extractedPoints);
      }
    }

    return [...new Set(points)];
  }
}
