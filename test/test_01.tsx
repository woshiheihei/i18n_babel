/*
 * @Descripttion:
 * @Author: meng.zhao
 * @Date: 2021-08-29 11:34:32
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2021-10-20 11:33:45
 */
import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { message, Progress } from '@tavi/antd';
import { DesktopOutlined } from '@ant-design/icons';
import { Icon } from '@ricons/utils';
import Storage24Regular from '@ricons/fluent/Storage24Regular';
import { diskinfo } from '@ohif/tavi/src/api';
import './index.css';
function NavigationHome(props) {
  const [diskInfoStatus, setDiskInfoStatus] = useState('#f0f0f0');
  const [diskText, setDiskText] = useState('磁盘剩余');
  const [diskInfoPercent, setDiskInfoPercent] = useState(0);
  const { history } = props;

  useEffect(() => {
    const renderDiskInfo = async () => {
      const { code, data, msg } = await diskinfo();
      if (code === 1) {
        const { use, mounted } = data;
        const percent = Number(use.replace('%', ''));
        const remain = 100 - percent + '%';
        setDiskInfoPercent(percent);
        setDiskText('磁盘剩余: ' + remain);
        if (percent > 0 && percent <= 20) {
          setDiskInfoStatus('#b7eb8f');
        } else if (percent > 20 && percent <= 40) {
          setDiskInfoStatus('#73d13d');
        } else if (percent > 40 && percent <= 60) {
          setDiskInfoStatus('#ffec3d');
        } else if (percent > 60 && percent <= 80) {
          setDiskInfoStatus('#ff9c6e');
        } else {
          setDiskText('磁盘空间即将不足');
          setDiskInfoStatus('#ff7a45');
        }
      } else {
        setDiskText(msg);
      }
    };
    renderDiskInfo();
  }, []);

  //跳转到相应的页面
  const router2module = path =>
    path ? history.push(path) : message.info('暂未开放此功能，敬请期待！');

  return (
    <>
      <div className="nav_root">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            className="nav_img"
            src="./../../../../assets/tavigatorCDSS_V.png"
          ></img>
        </div>
        <div className="nav_center">
          <div className="nav_center_title">
            {'拓微主瓣领航 临床辅助决策平台'}
          </div>
          <div
            className="patients_manage"
            onClick={() => {
              router2module('/study/studylist');
            }}
          >
            {'病例管理'}
          </div>
          <div
            className="action_muti"
            style={{ color: '#636060' }}
            onClick={() => {
              localStorage.removeItem('_command_studylist_openModal');
              router2module('/study/studylist');
              localStorage.setItem('_command_studylist_openModal', 'now');
            }}
          >
            {'添加新病例'}
          </div>
          <div
            className="action_muti"
            style={{ backgroundColor: '#3db3b1', color: '#636060' }}
            onClick={() => {
              router2module('/userSetting');
            }}
          >
            {'用户设置'}
          </div>
          <div
            className="action_muti"
            style={{ color: '#636060' }}
            onClick={() => router2module('/instruction')}
          >
            {'教程说明'}
          </div>
          <div
            className="action_muti"
            style={{
              backgroundColor: '#2e4d52',
            }}
            onClick={() => router2module('/operationLog')}
          >
            {'操作日志'}
          </div>
        </div>
        <div className="nav_right_img">
          <img src="./../../../../assets/tavi.png" />
          <section className="status-menu-item progress-container">
            <div>
              <p className={diskInfoPercent >= 80 ? 'disk-warning-80' : ''}>
                {diskText}
              </p>
              <Progress
                showInfo={false}
                percent={diskInfoPercent}
                size="small"
                strokeColor={diskInfoStatus}
              />
            </div>
            {/* <DesktopOutlined className="icon" /> */}
            <Icon>
              <Storage24Regular />
            </Icon>
          </section>
        </div>
      </div>
    </>
  );
}

export default withRouter(NavigationHome);
