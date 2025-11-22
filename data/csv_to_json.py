#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 data.csv 转换为 data.json 的脚本
使用 Python 标准库，不依赖任何第三方模块
"""

import csv
import json
import os

def csv_to_json(csv_file_path, json_file_path):
    """
    将 CSV 文件转换为 JSON 文件
    
    Args:
        csv_file_path: CSV 文件路径
        json_file_path: 输出的 JSON 文件路径
    """
    data = []
    
    # 读取 CSV 文件
    with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        # 将每一行转换为字典并添加到列表中
        for row in csv_reader:
            # 将 tags 字符串转换为数组
            if 'tags' in row and row['tags']:
                # 按逗号分割，去除每个标签前后的空格，过滤空字符串
                tags_list = [tag.strip() for tag in row['tags'].split(',') if tag.strip()]
                row['tags'] = tags_list
            else:
                row['tags'] = []
            data.append(row)
    
    # 写入 JSON 文件
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, ensure_ascii=False, indent=2)
    
    print(f"成功转换 {len(data)} 条记录")
    print(f"CSV 文件: {csv_file_path}")
    print(f"JSON 文件: {json_file_path}")

if __name__ == "__main__":
    # 获取脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 设置文件路径
    csv_file = os.path.join(script_dir, "data.csv")
    json_file = os.path.join(script_dir, "data.json")
    
    # 检查 CSV 文件是否存在
    if not os.path.exists(csv_file):
        print(f"错误: 找不到文件 {csv_file}")
        exit(1)
    
    # 执行转换
    csv_to_json(csv_file, json_file)

