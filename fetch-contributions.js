// fetch-contributions.js
const fs = require('fs');

// 注意：这个脚本会在 GitHub Actions 中运行，GITHUB_TOKEN 会自动注入
const token = process.env.GITHUB_TOKEN;
const username = 'HaichengHao';

async function fetchContributions() {
  if (!token) {
    console.error('❌ GITHUB_TOKEN 环境变量未设置');
    process.exit(1);
  }

  const years = [2022, 2023, 2024, 2025, 2026];
  const allContributions = [];
  
  for (const year of years) {
    console.log(`📅 正在获取 ${year} 年的贡献数据...`);
    
    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;
    
    try {
      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: {
            login: username,
            from: `${year}-01-01T00:00:00Z`,
            to: `${year}-12-31T23:59:59Z`
          }
        })
      });
      
      const data = await response.json();
      
      if (data.errors) {
        console.error(`❌ ${year} 年数据获取失败:`, data.errors);
        continue;
      }
      
      const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;
      
      weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          allContributions.push({
            date: day.date,
            count: day.contributionCount
          });
        });
      });
      
      console.log(`✅ ${year} 年数据获取成功，共 ${weeks.reduce((sum, week) => sum + week.contributionDays.length, 0)} 条记录`);
    } catch (error) {
      console.error(`❌ ${year} 年请求失败:`, error.message);
    }
  }
  
  // 保存数据到 JSON 文件
  fs.writeFileSync('contributions-data.json', JSON.stringify(allContributions, null, 2));
  console.log(`\n🎉 数据保存成功！共 ${allContributions.length} 条贡献记录 (2022-2026)`);
}

fetchContributions().catch(console.error);