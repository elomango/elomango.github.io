#!/usr/bin/env python3
import subprocess
import sys
import os
from pathlib import Path

def main():
    input_file = sys.argv[1]
    output_file = Path(input_file).with_name(Path(input_file).stem + '_en' + Path(input_file).suffix)

    print(f"번역 중: {input_file} → {output_file}")

    subprocess.run([
        'claude', '-p',
        f'{input_file} 파일을 영어로 번역해서 {output_file}로 저장해줘. 내용을 요약하지 말고 전체를 번역해줘.',
        '--dangerously-skip-permissions',
        '--allowedTools', 'Read,Write'
    ], check=True)

    print(f"✓ 번역 완료: {output_file}")

if __name__ == "__main__":
    main()