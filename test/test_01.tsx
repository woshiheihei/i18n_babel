import { useTranslation } from "react-i18next";
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TagModal from './TagModal';
import TagIcon from './TagIcon';
const TagIcon4SelectedData = ({
  studyList,
  selectedStudyInstanceUIDList,
  updateOuterComponent
}) => {
  const {
    t
  } = useTranslation();
  const onClickHandle = e => {
    e.stopPropagation();
    if (selectedStudyInstanceUIDList.length === 0) {
      message.info(t("ADD_TAGS"));
      return;
    }
    setIsModalOpen(true);
  };
  const modalCloseHandle = () => {
    setIsModalOpen(false);
  };
  return <>
      <Tooltip title={t("ADD_TAGS")}>
        <TagIcon onClick={onClickHandle}>{t("ADD_TAGS")}</TagIcon>
      </Tooltip>
      {isModalOpen && !!needTaggedDataList[1].length && <TagModal selectedDataList={needTaggedDataList} isModalOpen={isModalOpen} modalCloseHandle={modalCloseHandle} updateTagsHandler={updateOuterComponent}></TagModal>}
    </>;
};
const Test02 = ({
  studyList,
  selectedStudyInstanceUIDList,
  updateOuterComponent
}) => {
  const {
    t
  } = useTranslation();
  const onClickHandle = e => {
    e.stopPropagation();
    if (selectedStudyInstanceUIDList.length === 0) {
      message.info(t("ADD_TAGS"));
      return;
    }
    setIsModalOpen(true);
  };
  const modalCloseHandle = () => {
    setIsModalOpen(false);
  };
  return <>
      <Tooltip title={t("ADD_TAGS")}>
        <TagIcon onClick={onClickHandle}>{t("ADD_TAGS")}</TagIcon>
      </Tooltip>
      {isModalOpen && !!needTaggedDataList[1].length && <TagModal selectedDataList={needTaggedDataList} isModalOpen={isModalOpen} modalCloseHandle={modalCloseHandle} updateTagsHandler={updateOuterComponent}></TagModal>}
    </>;
};
export default TagIcon4SelectedData;