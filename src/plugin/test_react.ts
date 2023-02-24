import * as babel from "@babel/core"
import fs from "fs";


const code = `
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TagModal from './TagModal';
import TagIcon from './TagIcon';
import { Tooltip, message } from '@tavi/antd';
import { useTaggingSelectedRows } from '../../hooks/studyHooks';
import { useEffect } from 'react';
import TagDefaultIcon from '@ohif/tavi/src/assets/img/patientList/studyTableHeader/header-icons-default/TagDefaultIcon.svg';
import TagClickedIcon from '@ohif/tavi/src/assets/img/patientList/studyTableHeader/header-icons-multiple-select/TagClickedIcon.svg';

const TagIcon4SelectedData = ({
  studyList,
  selectedStudyInstanceUIDList,
  updateOuterComponent,
}) => {
  const selRowsLen = selectedStudyInstanceUIDList.length;
  const TagIcon = selRowsLen ? TagClickedIcon : TagDefaultIcon;
  console.log('selectedStudyInstanceUIDList: ', selectedStudyInstanceUIDList);
  const [isModalOpen, setIsModalOpen] = useState(false);

  let { needTaggedDataList, fetchSelectedListHandler } = useTaggingSelectedRows(
    studyList,
    selectedStudyInstanceUIDList
  );

  useEffect(() => {
    if (!isModalOpen) return;
    fetchSelectedListHandler();
  }, [fetchSelectedListHandler, isModalOpen]);

  const onClickHandle = e => {
    e.stopPropagation();
    if (selectedStudyInstanceUIDList.length === 0) {
      message.info('请选中需要打标签的数据');
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
        <TagIcon onClick={onClickHandle}></TagIcon>
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

TagIcon4SelectedData.propTypes = {
  studyList: PropTypes.array,
  selectedStudyInstanceUIDList: PropTypes.array,
  updateOuterComponent: PropTypes.func,
};

export default TagIcon4SelectedData;
`

const result = babel.transformSync(code, {
	ast: true,
  presets: ["@babel/preset-react"],
});

fs.writeFileSync("ast_output.json",JSON.stringify(result,null,2))
console.dir(result!.ast)
console.log(result!.code)