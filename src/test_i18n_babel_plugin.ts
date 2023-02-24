import * as babel from "@babel/core"
import plugin from './i18n_plugin'


const code = `
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TagModal from './TagModal';
import TagIcon from './TagIcon';

const TagIcon4SelectedData = ({
  studyList,
  selectedStudyInstanceUIDList,
  updateOuterComponent,
}) => {
  const { t1234 } = useTranslation();
 
  const onClickHandle = e => {
    e.stopPropagation();
    if (selectedStudyInstanceUIDList.length === 0) {
      message.info('添加标签');
      return;
    }
    setIsModalOpen(true);
  };

  const modalCloseHandle = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Tooltip title="添加标签">
        <TagIcon onClick={onClickHandle}>添加标签</TagIcon>
      </Tooltip>
      {isModalOpen && !!needTaggedDataList[1].length && (
        <TagModal
          selectedDataList={needTaggedDataList}
          isModalOpen={isModalOpen}
          modalCloseHandle={modalCloseHandle}
          updateTagsHandler={updateOuterComponent}
        ></TagModal>
      )}
    </>
  );
};


const test02 = ({
  studyList,
  selectedStudyInstanceUIDList,
  updateOuterComponent,
}) => {

  const onClickHandle = e => {
    e.stopPropagation();
    if (selectedStudyInstanceUIDList.length === 0) {
      message.info('添加标签');
      return;
    }
    setIsModalOpen(true);
  };

  const modalCloseHandle = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Tooltip title="添加标签">
        <TagIcon onClick={onClickHandle}>添加标签</TagIcon>
      </Tooltip>
      {isModalOpen && !!needTaggedDataList[1].length && (
        <TagModal
          selectedDataList={needTaggedDataList}
          isModalOpen={isModalOpen}
          modalCloseHandle={modalCloseHandle}
          updateTagsHandler={updateOuterComponent}
        ></TagModal>
      )}
    </>
  );
};

export default TagIcon4SelectedData;
`

const result = babel.transformSync(code, {
  babelrc: false,
  ast: true,
  plugins: [plugin(null, null, null), "@babel/plugin-syntax-jsx"],
  // presets: ["@babel/preset-react"],
  sourceMaps: true,
  sourceFileName: "aaa",
  configFile: false
})

console.log(result!.code)