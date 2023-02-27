import React, { useEffect, useState } from 'react';
import { Form, Table, Tooltip, Modal, Input } from '@tavi/antd';
import { initStudies } from './process';
import { Icon } from '@ricons/utils';
import { SERIES_TYPE_MAP, SERIES_TYPE } from '@ohif/tavi/src/util/constants';
import { CloseOutlined } from '@ant-design/icons';
import { InfoCircleOutlined } from '@ant-design/icons';
import Warning20Regular from '@ricons/fluent/Warning20Regular';
import NotepadEdit20Regular from '@ricons/fluent/NotepadEdit20Regular';
import VTKRotatableCrosshairsExample from '@ohif/viewer/src/components/customComponents/UpLocalFile/VTKRotatableCrosshairsExample';
import { selectStudyPatientName } from '@ohif/tavi/src/api';
import ChevronRight20Regular from '@ricons/fluent/ChevronRight20Regular';
import ChevronDown20Regular from '@ricons/fluent/ChevronDown20Regular';

import './index.less';

const SeriesTable = ({
  updatedStudies: studies,
  studyDicomFiles: dicomFiles,
  onSelectFeatureSelection,
}) => {
  // MPR 缩略图
  const [mprThumbnail, setMprThumbnail] = useState({
    visible: false,
    mprSeries: {},
    previewMetaData: {
      PatientName: '',
      seriesName: '',
      imageCount: '',
      SliceThickness: '',
    },
  });
  const [studyDataList, setStudyDataList] = useState(
    initStudies(studies, dicomFiles, setMprThumbnail)
  );
  // PatientName脱敏
  const [patientNameForm] = Form.useForm();

  /**
   * PatientName从数据库覆盖
   */
  useEffect(() => {
    const fetchPatientName = async ({ StudyInstanceUID }) =>
      await selectStudyPatientName({ StudyInstanceUID });
    for (let i = 0; i < studyDataList.length; i++) {
      const { StudyInstanceUID, nameAfterHash, PatientName } = studyDataList[i];
      fetchPatientName({ StudyInstanceUID }).then(({ code, data }) => {
        if (code === 1 && data.length > 0) {
          const { PatientName: PatientNameFromDB } = data[0];
          setStudyDataList(list =>
            list.map(study => {
              if (study.StudyInstanceUID == StudyInstanceUID)
                study.PatientNameFromDB = PatientNameFromDB;
              return study;
            })
          );
        }
      });
    }
  }, []);

  /**
   * 点击选中期相按钮, 全期相不能与主动脉外周共存
   * @param {number} index_study study 在 studyDataList中的 index
   * @param {number} index_series series 在 study seriesList 中的 index
   * @param {number} index_feature  feature 在 featureSelection 中的 index
   */
  const onClickFeatureSelectionItem = (index_study, seriesId, seriesType) => {
    const newStudyDataList = [...studyDataList];
    let parentSeriesId = seriesId;
    // 全期像，去除seriesId最后三位
    if (seriesType === SERIES_TYPE.panoramaChild)
      parentSeriesId =
        dicomFiles[newStudyDataList[index_study].StudyInstanceUID][seriesId]
          .parentSeries;
    const index_series = newStudyDataList[index_study].seriesList.findIndex(
      ele => ele.SeriesInstanceUID === parentSeriesId
    );
    const { active } = newStudyDataList[index_study].seriesList[
      index_series
    ].featureSelection;
    if (seriesType === 6) {
      newStudyDataList[index_study].seriesList[index_series].children.forEach(
        element => {
          element.featureSelection.active = !active;
        }
      );
      newStudyDataList[index_study].seriesList[
        index_series
      ].featureSelection.active = !active;
    } else if (seriesType === 61) {
      const series = newStudyDataList[index_study].seriesList[
        index_series
      ].children.find(ele => ele.SeriesInstanceUID === seriesId);
      series.featureSelection.active = !series.featureSelection.active;
      const hasNotActive = newStudyDataList[index_study].seriesList[
        index_series
      ].children.findIndex(ele => !ele.featureSelection.active);
      newStudyDataList[index_study].seriesList[
        index_series
      ].featureSelection.active = hasNotActive === -1;
    } else {
      newStudyDataList[index_study].seriesList[
        index_series
      ].featureSelection.active = !active;
    }

    setStudyDataList(newStudyDataList);
  };

  useEffect(() => {
    onSelectFeatureSelection(studyDataList);
  }, [studyDataList]);

  // 实时过滤输入的首尾空格
  const onValuesChange = ({ PatientNameRename }) => {
    patientNameForm.setFieldsValue({
      PatientNameRename: PatientNameRename.trim().replace(/\s+/gi, ' '),
    });
  };

  /**
   * 编辑患者姓名
   * 如果是多个study 的 Patient 命名，会存在问题
   */
  const onClickEditPatientName = (e, records, index) => {
    e.stopPropagation();
    Modal.confirm({
      title: '自定义患者姓名',
      icon: <InfoCircleOutlined />,
      content: (
        <Form
          key={index + ''}
          onValuesChange={onValuesChange}
          form={patientNameForm}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            name="PatientNameRename"
            style={{ marginBottom: 0 }}
            rules={[
              {
                required: true,
                message: '患者姓名不能为空',
              },
              {
                max: 20,
                message: '不能超过20个字符',
              },
              {
                pattern: new RegExp(/^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/),
                message: '不支持特殊字符，请删除后重试',
              },
            ]}
          >
            <Input
              type="text"
              autoComplete="off"
              placeholder="请输入患者姓名"
            />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const { PatientNameRename } = patientNameForm.getFieldValue();
        try {
          await patientNameForm.validateFields(['PatientNameRename']);
          const { StudyInstanceUID } = records;
          if (records.PatientNameFromDB) {
            setStudyDataList(list =>
              list.map(study => {
                if (study.StudyInstanceUID == StudyInstanceUID)
                  study.PatientNameFromDB = PatientNameRename;
                return study;
              })
            );
          } else {
            setStudyDataList(list =>
              list.map(study => {
                if (study.StudyInstanceUID == StudyInstanceUID)
                  study.nameAfterHash = PatientNameRename;
                return study;
              })
            );
          }

          patientNameForm.setFieldsValue({ PatientNameRename: '' });
        } catch (error) {
          throw new Error(error);
        }
      },
    });
  };

  /**
   * 关闭 mpr 缩略图预览
   */
  const onCloseMprPreview = () => {
    setMprThumbnail({ visible: false });
  };

  const onClickCopyName = e => {
    e.stopPropagation();
  };

  /**
   * study 表格
   */
  const studyTableColumns = [
    {
      title: '姓名',
      dataIndex: 'PatientName',
      key: 'PatientName',
      render: (text, records, indeex) => {
        return <span onClick={onClickCopyName}>{records.PatientName}</span>;
      },
    },
    {
      title: '脱敏后显示',
      dataIndex: 'nameAfterHash',
      key: 'nameAfterHash',
      render: (text, records, index) => {
        return (
          <div
            style={{ display: 'inline-flex', alignItems: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            {records.PatientNameFromDB ? (
              <span style={{ marginRight: '5px' }}>
                {records.PatientNameFromDB}
              </span>
            ) : (
              <span style={{ marginRight: '5px' }}>
                {records.nameAfterHash}
              </span>
            )}

            {/* 提示 */}
            <Tooltip
              placement="bottom"
              title={
                '因检测到您先前上传过同一次扫描的序列，Tavigator将默认使用您先前修改的姓名作为本次上传序列的姓名。'
              }
            >
              {records.PatientNameFromDB && (
                <span
                  style={{
                    fontSize: '18px',
                    cursor: 'pointer',
                    height: '18px',
                    lineHeight: '1px',
                  }}
                >
                  <Icon>
                    <Warning20Regular />
                  </Icon>
                </span>
              )}
            </Tooltip>
            <Tooltip placement="bottom" title={'自定义病例名称'}>
              <span
                style={{
                  fontSize: '18px',
                  cursor: 'pointer',
                  height: '18px',
                  lineHeight: '1px',
                }}
                onClick={e => onClickEditPatientName(e, records, index)}
              >
                <Icon>
                  <NotepadEdit20Regular />
                </Icon>
              </span>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: '病历号',
      dataIndex: 'PatientID',
      key: 'PatientID',
    },
    {
      title: '年龄',
      dataIndex: 'PatientAge',
      key: 'PatientAge'
    },
    {
      title: '性别',
      dataIndex: 'PatientSex',
      key: 'PatientSex',
    },
    {
      title: ' CT 采集时间',
      dataIndex: 'StudyDate',
      key: 'StudyDate'
    },
  ];

  const StudyExpandIcon = ({ expanded, onExpand, record }) => (
    <span onClick={e => onExpand(record, e)}>
      {expanded ? (
        <Icon>
          <ChevronDown20Regular />
        </Icon>
      ) : (
        <Icon>
          <ChevronRight20Regular />
        </Icon>
      )}
    </span>
  );

  /**
   * series 嵌套子表格, 隶书 study 级别
   */
  const expandedRowRender = (record, index_study) => {
    const seriesTableColumns = [
      {
        title: '序列名称',
        dataIndex: 'seriesName',
        key: 'seriesName',
        width: 200,
      },
      {
        title: '序列编号',
        dataIndex: 'SeriesNumber',
        key: 'SeriesNumber',
        width: 60,
      },
      {
        title: '切片数量',
        dataIndex: 'SliceNum',
        key: 'SliceNum',
        width: 60,
      },
      {
        title: '层厚',
        dataIndex: 'SliceThickness',
        key: 'SliceThickness',
        width: 60,
      },
      {
        title: '缩略图',
        dataIndex: 'seriesThumbnail',
        key: 'seriesThumbnail',
        width: 200
      },
      {
        title: '序列特征选择',
        dataIndex: 'seriesFeatureSelection',
        key: 'seriesFeatureSelection',
        width: 150,
        render: (key, records) => {
          const { featureSelection, SeriesInstanceUID } = records;
          return (
            <div
              className={`feature-selection-item ${featureSelection.disable &&
                'forbid-click'} feature-selection-item-${featureSelection.seriesType} feature-selection-item${featureSelection.active ? '-active' : ''}`}
            >
              <div
                onClick={ev => {
                  ev.stopPropagation();
                  onClickFeatureSelectionItem(
                    index_study,
                    SeriesInstanceUID,
                    featureSelection.seriesType
                  );
                }}
              >
                {SERIES_TYPE_MAP[featureSelection.seriesType]}
              </div>
            </div>
          );
        },
      },
    ];

    return (
      <Table
        columns={seriesTableColumns}
        dataSource={record.seriesList}
        pagination={false}
        expandable={{
          expandRowByClick: true,
        }}
        sticky={true}
      />
    );
  };

  return (
    <>
      <section>
        <div className="table-wrapper upload-table-list">
          <Table
            dataSource={studyDataList}
            columns={studyTableColumns}
            pagination={false}
            rowKey={record => record.key}
            expandable={{
              expandedRowRender,
              defaultExpandAllRows: true,
              expandRowByClick: true,
              expandIcon: StudyExpandIcon,
            }}
          />
        </div>
        <div className="tip-text-container">
          <p>
            请确认以上序列所对应的序列特征无误，且达到了TAVR术前CT分析对影像质量要求的4级
          </p>
          <pre><span>1级:</span>无增强效果，无法看到清晰的边界，无法分析，需要重新扫描。      <span>2级:</span>可看到部分边界，但仍无法分析，需要重新扫描。     <span>3-级:</span>可看到边界，可进行大致分析，但难以保证精准，需要补充扫描。</pre>
          <pre><span>3+级:</span>可看到相对清晰边界，可进行大致分析但难以保证精准，需补充扫描（较3-更为清晰）。     <span>4级:</span>边界清晰锐利，较少不规则图形，可进行精确分析。</pre>
        </div>
      </section>
      {mprThumbnail.visible && (
        <div className="preview-mpr-container">
          <div className="table-wrapper">
            <span className="close-btn" onClick={() => onCloseMprPreview()}>
              <CloseOutlined />
            </span>
            <section className="series-info">
              <p>姓名: {mprThumbnail.previewMetaData.PatientName}</p>
              <p>序列名称: {mprThumbnail.previewMetaData.seriesName}</p>
              <p>切片数量: {mprThumbnail.previewMetaData.imageCount}</p>
              <p>层厚: {mprThumbnail.previewMetaData.SliceThickness}</p>
            </section>
            <VTKRotatableCrosshairsExample
              dicomFiles={dicomFiles}
              mprSeries={mprThumbnail.mprSeries}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SeriesTable;
