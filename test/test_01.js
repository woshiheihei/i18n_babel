import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Table, Tag, message, Modal, Menu, Dropdown, Tooltip, Space, Button } from '@tavi/antd';
import { ShareAltOutlined, DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import { Icon } from '@ricons/utils';
import ShareAndroid20Regular from '@ricons/fluent/ShareAndroid20Regular';
import ArrowCounterclockwise20Regular from '@ricons/fluent/ArrowCounterclockwise20Regular';
import Delete20Regular from '@ricons/fluent/Delete20Regular';
import { Thumbnail } from '@ohif/ui';
import axios from '../../warpAxios';
import { STATUS, initDropValue } from './constVar.config';
import { useSelector, useDispatch } from 'react-redux';
import OHIF from '@ohif/core';
import { extensionManager } from './../../../../viewer/src/App.js';
import './TableShowSeries.less';
function TableShowSeries(props) {
  const {
    t
  } = useTranslation();
  let {
    handleClikItem,
    StudyInstanceUID,
    server,
    userList,
    expanded,
    handleShareClickItem,
    handleReanalyseClickItem
  } = props;
  const timer = useRef();
  const [studyINFO, setStudyINFO] = useState([]);
  const seriesInfoArr = useMemo(() => {
    return userList.filter(seriesInfo => seriesInfo.StudyInstanceUID == StudyInstanceUID);
  }, [StudyInstanceUID, userList]);
  useEffect(() => {
    Promise.all(seriesInfoArr.map(seriesInfo => {
      return getSeriesInfo({
        server,
        StudyInstanceUID: seriesInfo.StudyInstanceUID,
        SeriesInstanceUID: seriesInfo.SeriesInstanceUID
      });
    })).then(data => {
      setStudyINFO(data);
    });
  }, [seriesInfoArr]);
  let thumbnailsINFO = _mapStudiesToThumbnails(studyINFO);
  const [seriesTableLoading, setSeriesTableLoading] = useState(true);
  const [seriesDataFromDB, setSeriesDataFromDB] = useState([]);
  let _seriesData = useMemo(() => {
    if (studyINFO.length == 0) return {};
    let tempSourceData = {};
    studyINFO.forEach((study, index) => {
      console.log('study: ', study);
      let selectThumbs = thumbnailsINFO[index].thumbnails;
      let selectStudy = study || studyINFO[0];
      let displaySets = selectStudy.displaySets;
      // 用一个字段记录StudyInstanceUID
      tempSourceData['StudyInstanceUID'] = selectStudy.StudyInstanceUID;
      displaySets.forEach(ImageSet => {
        let {
          SeriesDescription,
          SeriesInstanceUID,
          numImageFrames,
          displaySetInstanceUID,
          SliceThickness
        } = ImageSet;
        let thumbnailPer = selectThumbs.filter(item => item.displaySetInstanceUID == displaySetInstanceUID);
        thumbnailPer[0].StudyInstanceUID = selectStudy.StudyInstanceUID;
        tempSourceData[SeriesInstanceUID] = {
          key: SeriesInstanceUID,
          SeriesInstanceUID,
          description: SeriesDescription,
          SliceThickness: SliceThickness + 'mm',
          count: numImageFrames || 0,
          preView: thumbnailPer[0],
          status: '0',
          StudyInstanceUID: selectStudy.StudyInstanceUID,
          PatientID: selectStudy.PatientID
        };
      });
    });
    return tempSourceData;
  }, [studyINFO]);
  let fetchData = async StudyInstanceUID => {
    let seriesData = await getSeriesStatus(StudyInstanceUID);
    setSeriesDataFromDB(seriesData);
    setSeriesTableLoading(false);
  };

  //请求series 当前状态
  useEffect(() => {
    if (!expanded) {
      clearInterval(timer.current);
      return;
    }
    if (!_seriesData.StudyInstanceUID) return;
    timer.current = setInterval(() => {
      fetchData(_seriesData.StudyInstanceUID);
    }, 1000 * 5);
    fetchData(_seriesData.StudyInstanceUID);
    return () => clearInterval(timer.current);
  }, [_seriesData, expanded]);
  let tableDataArr = useMemo(() => {
    if (!_seriesData.StudyInstanceUID && seriesDataFromDB.length === 0) return [];
    return seriesDataFromDB.map((item, index) => {
      const SeriesInstanceUID = item.SeriesInstanceUID;
      return {
        ..._seriesData[SeriesInstanceUID],
        key: _seriesData[SeriesInstanceUID].key + item.seriesType,
        //防止key重复
        status: item.status + '',
        seriesType: item.seriesType,
        id: item.id,
        userId: item.userId
      };
    }).filter(item => item.key);
  }, [seriesDataFromDB, _seriesData]);
  // console.log('_seriesData: ', _seriesData);
  // console.log('seriesDataFromDB: ', seriesDataFromDB);
  // console.log('tableDataArr: ', tableDataArr);

  //更新表数据
  const columns = [{
    title: t("SERIES_DESCRIPTION"),
    dataIndex: 'description',
    key: 'description',
    width: 200
  }, {
    title: t("SLICE_NUMBER"),
    dataIndex: 'count',
    key: 'count',
    width: 200
  }, {
    title: t("SLICE_THICKNESS"),
    width: '100px',
    key: 'SliceThickness',
    dataIndex: 'SliceThickness'
  }, {
    title: t("SELECT_THE_CORRESPONDING_CATEGORY"),
    dataIndex: 'seriesType',
    key: 'seriesType',
    width: 200,
    render: key => <>
      {initDropValue.filter(drop => drop.type === key)[0].value || '未分配'}
    </>
  }, {
    title: t("THUMBNAILS"),
    dataIndex: 'preView',
    key: 'preView',
    width: 200,
    render: props => {
      return <Thumbnail key={props.displaySetInstanceUID} id={props.displaySetInstanceUID} StudyInstanceUID={props.StudyInstanceUID} displaySetInstanceUID={props.displaySetInstanceUID} imageId={props.imageId} hasWarnings={props.hasWarnings} customStyle={true} />;
    }
  }, {
    title: t("PROCESSING_STATUS"),
    dataIndex: 'status',
    key: 'status',
    width: 200,
    render: key => <>
      {STATUS[key] ? <span style={{
        color: STATUS[key].color
      }}>
        {STATUS[key].value}
      </span> : <span style={{
        color: STATUS['fail'].color
      }}>
        {STATUS['fail'].value}
      </span>}
    </>
    // onCell: record => {
    //   return {
    //     onClick: () => {
    //       record.seriesTypeStr =
    //         initDropValue.filter(drop => drop.type === record.seriesType)[0]
    //           .value || '未分配';
    //       let { status } = record;
    //       if (status != '42' && status != '44') {
    //         message.warning({
    //           content: '当前数据分析未完成',
    //         });
    //         return;
    //       }
    //       handleClikItem(record);
    //     },
    //     style: { cursor: 'pointer' },
    //   };
    // },
  }, {
    title: t("TOOLS"),
    dataIndex: '',
    key: 'x',
    render: records => {
      return <>
        <Space>
          <Tooltip placement="top" title={t("DELETE")}>
            <span className="manipulate-cell" onClick={e => {
              e.stopPropagation();
              Modal.confirm({
                content: t("SURE_TO_DELETE_"),
                onOk: async () => {
                  // const { studyINFO } = props;
                  // console.log('props: ', props);
                  let {
                    SeriesInstanceUID,
                    StudyInstanceUID,
                    description,
                    seriesType
                  } = records;
                  const selectStudy = studyINFO.filter(study => study.StudyInstanceUID === StudyInstanceUID);
                  const {
                    PatientName
                  } = selectStudy[0];
                  //TODO pingcode - 819 bug
                  let res = await axios.delete(`/api/v1/deleteSeries?studyInstanceUID=${StudyInstanceUID}&seriesInstanceUID=${SeriesInstanceUID}&seriesType=${seriesType}`);
                  let {
                    code
                  } = res;
                  if (code == 1) {
                    message.success('删除成功');
                    // TODO 删除序列日志
                    axios.post('/api/v1/addLog', {
                      abbr: 'del_index',
                      dataList: [{
                        studyUid: StudyInstanceUID,
                        patientName: PatientName,
                        indexName: description
                      }]
                    });
                    fetchData(StudyInstanceUID);
                    // updateTable();
                  } else {
                    message.error('删除失败');
                  }
                }
              });
            }}>
              <Icon style={{
                fontSize: '20px'
              }}>
                <Delete20Regular />
              </Icon>
            </span>
          </Tooltip>
          <Tooltip placement="top" title={t("SHARE")}>
            <span className="manipulate-cell" onClick={e => {
              e.stopPropagation();
              let {
                status
              } = records;
              if (status != '42' && status != '44') return message.warning(t("CALCULATION_NOT_FINISHED"));
              handleShareClickItem(records);
            }}>
              <Icon style={{
                fontSize: '20px'
              }}>
                <ShareAndroid20Regular />
              </Icon>
              {/* <ShareAltOutlined /> */}
            </span>
          </Tooltip>
          <Tooltip placement="top" title={t("RECALCULATE")}>
            <span className="manipulate-cell" style={{
              fontSize: '20px'
            }} onClick={e => {
              e.stopPropagation();
              let {
                status
              } = records;
              if (status != '42' && status != '44') return message.warning(t("CALCULATION_NOT_FINISHED"));
              handleReanalyseClickItem(records);
            }}>
              <Icon style={{
                fontSize: '20px'
              }}>
                <ArrowCounterclockwise20Regular />
              </Icon>
            </span>
          </Tooltip>
        </Space>
      </>;
    },
    width: 200,
    onCell: records => { }
  }];
  return <div>
    <Table columns={columns} dataSource={tableDataArr} pagination={false} loading={seriesTableLoading} onRow={record => {
      return {
        onClick: () => {
          record.seriesTypeStr = initDropValue.filter(drop => drop.type === record.seriesType)[0].value || '未分配';
          let {
            status
          } = record;
          if (status != '42' && status != '44') {
            message.warning({
              content: t("CALCULATION_NOT_FINISHED")
            });
            return;
          }
          handleClikItem(record);
        },
        style: {
          cursor: 'pointer'
        }
      };
    }} />
  </div>;
}
TableShowSeries.propTypes = {
  studyINFO: PropTypes.array,
  handleClikItem: PropTypes.func,
  handleShareClickItem: PropTypes.func,
  handleReanalyseClickItem: PropTypes.func
};

// 辅助函数
async function getSeriesStatus(StudyInstanceUID) {
  let res = await axios.get(`/api/v1/AS/web/getSeriesStatus?StudyInstanceUID=${StudyInstanceUID}`);
  let {
    data
  } = res;
  return data;
}
const _mapStudiesToThumbnails = function (studies) {
  if (studies.length === 0) return [];
  return studies.map(study => {
    const {
      StudyInstanceUID
    } = study;
    const thumbnails = study.displaySets.map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesDescription,
        InstanceNumber,
        numImageFrames,
        SeriesNumber
      } = displaySet;
      let imageId;
      let altImageText;
      if (displaySet.Modality && displaySet.Modality === 'SEG') {
        // TODO: We want to replace this with a thumbnail showing
        // the segmentation map on the image, but this is easier
        // and better than what we have right now.
        altImageText = 'SEG';
      } else if (displaySet.images && displaySet.images.length) {
        const imageIndex = Math.floor(displaySet.images.length / 2);
        imageId = displaySet.images[imageIndex].getImageId();
      } else {
        altImageText = displaySet.Modality ? displaySet.Modality : 'UN';
      }
      return {
        imageId,
        altImageText,
        displaySetInstanceUID,
        SeriesDescription,
        InstanceNumber,
        numImageFrames,
        SeriesNumber,
        hasWarnings: Promise.resolve('test')
      };
    });
    return {
      StudyInstanceUID,
      thumbnails
    };
  });
};
async function getSeriesInfo({
  server,
  StudyInstanceUID,
  SeriesInstanceUID
}) {
  OHIF.studies.deleteStudyMetadataPromise(StudyInstanceUID);
  let seriesMetaData = await OHIF.studies.retrieveStudyMetadata(server, StudyInstanceUID, {
    seriesInstanceUID: SeriesInstanceUID
  }, false);
  console.log('seriesMetaData: ', seriesMetaData);
  _updateStudyDisplaySets(seriesMetaData, new OHIF.metadata.OHIFStudyMetadata(seriesMetaData, seriesMetaData.StudyInstanceUID));
  return seriesMetaData;
}
function _updateStudyDisplaySets(study, studyMetadata) {
  const sopClassHandlerModules = extensionManager.modules['sopClassHandlerModule'];
  if (!study.displaySets) {
    study.displaySets = studyMetadata.createDisplaySets(sopClassHandlerModules);
  }
  if (study.derivedDisplaySets) {
    studyMetadata._addDerivedDisplaySets(study.derivedDisplaySets);
  }
}
export default TableShowSeries;
export { STATUS };